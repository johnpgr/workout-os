const DB_NAME = 'ppl-training-logs';
const DB_VERSION = 1;
const STORE_NAME = 'session_logs';

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
const TYPE_LABELS = {
  push: 'Push',
  pull: 'Pull',
  leg: 'Legs',
  rest: 'Descanso'
};
const WEEK_PATTERNS = {
  '6': ['push', 'pull', 'leg', 'push', 'pull', 'leg', 'rest'],
  '3': ['push', 'rest', 'pull', 'rest', 'leg', 'rest', 'rest']
};

const state = {
  weekValue: '',
  mode: '6',
  weekDates: [],
  weekLogs: [],
  selectedDate: ''
};

const dbPromise = openDatabase();

const elements = {
  weekPicker: document.getElementById('week-picker'),
  modeSelect: document.getElementById('calendar-mode'),
  weekCalendar: document.getElementById('week-calendar'),
  weekSummary: document.getElementById('week-summary'),
  dayLogs: document.getElementById('selected-day-logs')
};

boot();

function boot() {
  mountWorkoutForms();

  state.weekValue = getISOWeekInputValue(new Date());
  elements.weekPicker.value = state.weekValue;
  elements.modeSelect.value = state.mode;

  elements.weekPicker.addEventListener('change', async () => {
    state.weekValue = elements.weekPicker.value;
    await refreshWeek();
  });

  elements.modeSelect.addEventListener('change', async () => {
    state.mode = elements.modeSelect.value;
    await refreshWeek();
  });

  refreshWeek();
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_date', 'date', { unique: false });
        store.createIndex('by_workout_type', 'workoutType', { unique: false });
        store.createIndex('by_created_at', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Nao foi possivel abrir o IndexedDB.'));
  });
}

async function addLog(log) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(log);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Falha ao salvar log.'));
  });
}

async function deleteLog(id) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Falha ao excluir log.'));
  });
}

async function getLogsByDateRange(startDateISO, endDateISO) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('by_date');
    const range = IDBKeyRange.bound(startDateISO, endDateISO);
    const logs = [];

    index.openCursor(range).onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        logs.push(cursor.value);
        cursor.continue();
      }
    };

    tx.oncomplete = () => {
      logs.sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return String(b.createdAt).localeCompare(String(a.createdAt));
      });
      resolve(logs);
    };
    tx.onerror = () => reject(tx.error || new Error('Falha ao carregar logs da semana.'));
  });
}

function mountWorkoutForms() {
  const roots = document.querySelectorAll('.workout-log-root');
  const todayISO = toISODateString(new Date());

  roots.forEach((root) => {
    const workoutType = root.dataset.workoutType;
    const workoutLabel = root.dataset.workoutLabel || TYPE_LABELS[workoutType] || 'Treino';
    const dayCard = root.closest('.workout-day');
    const exerciseNames = Array.from(dayCard.querySelectorAll('.exercise-name')).map((node) => node.textContent.trim());

    root.innerHTML = buildFormMarkup(workoutType, workoutLabel, exerciseNames, todayISO);

    const form = root.querySelector('form');
    const clearButton = root.querySelector('[data-action="clear"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const statusEl = form.querySelector('[data-form-status]');
      const date = form.elements.date.value;
      const durationMin = Number(form.elements.duration.value);
      const notes = form.elements.notes.value.trim();

      if (!date) {
        setStatus(statusEl, 'Informe a data do treino.', true);
        return;
      }

      if (!durationMin || durationMin <= 0) {
        setStatus(statusEl, 'Informe a minutagem da sessao.', true);
        return;
      }

      const exercises = Array.from(form.querySelectorAll('[data-exercise-row]')).map((row) => {
        const name = row.dataset.exercise;
        const sets = Number(row.querySelector('[data-input="sets"]').value || 0);
        const reps = Number(row.querySelector('[data-input="reps"]').value || 0);
        const weight = Number(row.querySelector('[data-input="weight"]').value || 0);

        return { name, sets, reps, weight };
      }).filter((item) => item.sets > 0 || item.reps > 0 || item.weight > 0);

      const log = {
        workoutType,
        workoutLabel,
        date,
        durationMin,
        notes,
        exercises,
        createdAt: new Date().toISOString()
      };

      try {
        await addLog(log);
        setStatus(statusEl, 'Treino salvo com sucesso.', false);

        form.querySelectorAll('[data-input="sets"], [data-input="reps"], [data-input="weight"]').forEach((input) => {
          input.value = '';
        });
        form.elements.notes.value = '';

        const savedWeek = getISOWeekInputValue(new Date(`${date}T00:00:00`));
        if (state.weekValue !== savedWeek) {
          state.weekValue = savedWeek;
          elements.weekPicker.value = savedWeek;
        }

        await refreshWeek(date);
      } catch (error) {
        setStatus(statusEl, 'Nao foi possivel salvar no IndexedDB.', true);
        console.error(error);
      }
    });

    clearButton.addEventListener('click', () => {
      form.querySelectorAll('[data-input="sets"], [data-input="reps"], [data-input="weight"]').forEach((input) => {
        input.value = '';
      });
      form.elements.notes.value = '';
      setStatus(form.querySelector('[data-form-status]'), 'Campos limpos.', false);
    });
  });
}

function buildFormMarkup(workoutType, workoutLabel, exerciseNames, defaultDate) {
  const rows = exerciseNames.map((name) => `
    <tr data-exercise-row data-exercise="${escapeHTML(name)}">
      <td>${escapeHTML(name)}</td>
      <td><input type="number" min="0" step="1" data-input="sets" placeholder="sets"></td>
      <td><input type="number" min="0" step="1" data-input="reps" placeholder="reps"></td>
      <td><input type="number" min="0" step="0.5" data-input="weight" placeholder="kg"></td>
    </tr>
  `).join('');

  return `
    <details class="log-details">
      <summary>Registrar Sessao - ${escapeHTML(workoutLabel)}</summary>
      <div class="log-details-content">
        <form>
          <div class="session-form-grid">
            <div class="field">
              <label>Data</label>
              <input type="date" name="date" value="${defaultDate}" required>
            </div>
            <div class="field">
              <label>Duracao (min)</label>
              <input type="number" min="1" step="1" name="duration" placeholder="Ex: 82" required>
            </div>
            <div class="field" style="grid-column: 1 / -1;">
              <label>Observacoes</label>
              <textarea name="notes" placeholder="Como foi o treino, tecnica, fadiga, dor, etc."></textarea>
            </div>
          </div>
          <table class="exercise-log-table">
            <thead>
              <tr>
                <th>Exercicio</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Peso (kg)</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Salvar no IndexedDB</button>
            <button type="button" class="btn" data-action="clear">Limpar Campos</button>
            <span class="form-status" data-form-status></span>
          </div>
        </form>
      </div>
    </details>
  `;
}

async function refreshWeek(preferredDate) {
  if (!state.weekValue) return;

  state.weekDates = getWeekDates(state.weekValue);
  const start = toISODateString(state.weekDates[0]);
  const end = toISODateString(state.weekDates[6]);

  state.weekLogs = await getLogsByDateRange(start, end);

  if (!state.selectedDate || !state.weekDates.some((day) => toISODateString(day) === state.selectedDate)) {
    state.selectedDate = preferredDate && state.weekDates.some((day) => toISODateString(day) === preferredDate)
      ? preferredDate
      : toISODateString(state.weekDates[0]);
  }

  renderCalendar();
  renderSummary();
  renderDayLogs();
}

function renderCalendar() {
  const logsByDate = groupLogsByDate(state.weekLogs);

  elements.weekCalendar.innerHTML = state.weekDates.map((day, index) => {
    const dayISO = toISODateString(day);
    const dayLogs = logsByDate.get(dayISO) || [];
    const totalMinutes = dayLogs.reduce((sum, log) => sum + Number(log.durationMin || 0), 0);
    const planType = (WEEK_PATTERNS[state.mode] || WEEK_PATTERNS['6'])[index];

    return `
      <button class="calendar-day ${planType} ${dayISO === state.selectedDate ? 'selected' : ''} ${dayLogs.length ? 'has-log' : ''}" data-date="${dayISO}">
        <div class="calendar-weekday">${WEEKDAY_LABELS[index]}</div>
        <div class="calendar-date">${formatDateBR(day)}</div>
        <div class="calendar-plan">Planejado: ${TYPE_LABELS[planType]}</div>
        <div class="calendar-count">${dayLogs.length ? `${dayLogs.length} log(s) · ${totalMinutes} min` : 'Sem registros'}</div>
      </button>
    `;
  }).join('');

  elements.weekCalendar.querySelectorAll('[data-date]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedDate = button.dataset.date;
      renderCalendar();
      renderDayLogs();
    });
  });
}

function renderSummary() {
  const totalSessions = state.weekLogs.length;
  const totalMinutes = state.weekLogs.reduce((sum, log) => sum + Number(log.durationMin || 0), 0);
  const totalPush = state.weekLogs.filter((log) => log.workoutType === 'push').length;
  const totalPull = state.weekLogs.filter((log) => log.workoutType === 'pull').length;
  const totalLegs = state.weekLogs.filter((log) => log.workoutType === 'leg').length;

  elements.weekSummary.innerHTML = `
    <div class="summary-card">
      <div class="summary-label">Sessoes</div>
      <div class="summary-value">${totalSessions}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Minutos Totais</div>
      <div class="summary-value">${totalMinutes}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Push / Pull / Legs</div>
      <div class="summary-value">${totalPush} / ${totalPull} / ${totalLegs}</div>
    </div>
  `;
}

function renderDayLogs() {
  const selectedLogs = state.weekLogs
    .filter((log) => log.date === state.selectedDate)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  if (!selectedLogs.length) {
    elements.dayLogs.innerHTML = `
      <p class="day-logs-empty">Sem registros em ${formatISOToBR(state.selectedDate)}. Use os formularios abaixo para salvar treinos.</p>
    `;
    return;
  }

  elements.dayLogs.innerHTML = selectedLogs.map((log) => {
    const chips = (log.exercises || []).map((exercise) => {
      const parts = [];
      if (exercise.sets) parts.push(`${exercise.sets}s`);
      if (exercise.reps) parts.push(`${exercise.reps}r`);
      if (exercise.weight) parts.push(`${exercise.weight}kg`);
      return `<span class="exercise-chip">${escapeHTML(exercise.name)} ${parts.length ? `(${parts.join(' / ')})` : ''}</span>`;
    }).join('');

    return `
      <article class="day-log-item">
        <div class="day-log-header">
          <strong>${escapeHTML(log.workoutLabel || TYPE_LABELS[log.workoutType] || 'Treino')}</strong>
          <div>
            <span class="day-log-meta">${log.durationMin} min</span>
            <button class="btn btn-danger" data-delete-id="${log.id}" style="margin-left: 0.5rem;">Excluir</button>
          </div>
        </div>
        ${log.notes ? `<p class="day-log-notes">${escapeHTML(log.notes)}</p>` : ''}
        <div class="exercise-chip-list">${chips || '<span class="exercise-chip">Sem exercicios detalhados</span>'}</div>
      </article>
    `;
  }).join('');

  elements.dayLogs.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = Number(button.dataset.deleteId);
      if (!window.confirm('Excluir este log?')) return;

      try {
        await deleteLog(id);
        await refreshWeek(state.selectedDate);
      } catch (error) {
        console.error(error);
        window.alert('Nao foi possivel excluir o log.');
      }
    });
  });
}

function groupLogsByDate(logs) {
  const map = new Map();
  logs.forEach((log) => {
    if (!map.has(log.date)) map.set(log.date, []);
    map.get(log.date).push(log);
  });
  return map;
}

function setStatus(element, message, isError) {
  element.textContent = message;
  element.classList.toggle('error', isError);
  element.classList.toggle('success', !isError);
}

function getWeekDates(weekValue) {
  const [yearText, weekText] = weekValue.split('-W');
  const year = Number(yearText);
  const week = Number(weekText);

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayUTC = new Date(jan4);
  mondayUTC.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);

  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const dayUTC = new Date(mondayUTC);
    dayUTC.setUTCDate(mondayUTC.getUTCDate() + i);
    days.push(new Date(dayUTC.getUTCFullYear(), dayUTC.getUTCMonth(), dayUTC.getUTCDate()));
  }

  return days;
}

function getISOWeekInputValue(date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);

  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);

  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function toISODateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateBR(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatISOToBR(isoDate) {
  if (!isoDate) return '-';
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

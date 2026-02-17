-- Seed YouTube URLs for existing exercise_catalog rows.
-- Safe to run multiple times.

update exercise_catalog
set youtube_url = values_map.youtube_url,
    updated_at = timezone('utc', now())
from (
  values
    ('supino-reto-barra', 'https://www.youtube.com/watch?v=EZMYCLKuGow'),
    ('supino-inclinado-halteres', 'https://www.youtube.com/watch?v=Fynry-4KKOo'),
    ('desenvolvimento-militar', 'https://www.youtube.com/watch?v=dxQCyYawS-0'),
    ('elevacao-lateral', 'https://www.youtube.com/watch?v=IwWvZ0rlNXs'),
    ('triceps-corda', 'https://www.youtube.com/watch?v=KhK5HWJfsrQ'),
    ('triceps-paralelas', 'https://www.youtube.com/watch?v=EjNigPXifrw'),
    ('barra-fixa', 'https://www.youtube.com/watch?v=UBBaAvoeQYs'),
    ('remada-curvada', 'https://www.youtube.com/watch?v=HpvaOR4H5Hg'),
    ('remada-sentada', 'https://www.youtube.com/watch?v=DbzBn7oyMSo'),
    ('puxada-frontal', 'https://www.youtube.com/watch?v=_d99A6p-doE'),
    ('facepull', 'https://www.youtube.com/watch?v=kYMTJAx_dTM'),
    ('rosca-direta', 'https://www.youtube.com/watch?v=uw-u4ekr7EE'),
    ('agachamento-livre', 'https://www.youtube.com/watch?v=Szjf6iPoGVk'),
    ('agachamento-frontal', 'https://www.youtube.com/watch?v=Lk2bQ4INdlA'),
    ('levantamento-terra-romeno', 'https://www.youtube.com/watch?v=wT_3ZNqDs64'),
    ('stiff-com-halteres', 'https://www.youtube.com/watch?v=8R-Yz0yQIn0'),
    ('leg-press', 'https://www.youtube.com/watch?v=7sn9nOwnjqQ'),
    ('cadeira-extensora', 'https://www.youtube.com/watch?v=pP5TXDRvTkY'),
    ('mesa-flexora', 'https://www.youtube.com/watch?v=ZPvzZvkgFw0'),
    ('afundo-caminhando', 'https://www.youtube.com/watch?v=qiFvkFOSXpk'),
    ('panturrilha-em-pe', 'https://www.youtube.com/watch?v=4_bpk2pfB8A')
) as values_map(id, youtube_url)
where exercise_catalog.id = values_map.id;

-- Optional sanity check
-- select id, name, youtube_url from exercise_catalog order by sort_order, name;

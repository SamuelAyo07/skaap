DO $$
DECLARE
  cities text[][] := ARRAY[
    ARRAY['New York','NY'], ARRAY['Los Angeles','CA'], ARRAY['Chicago','IL'],
    ARRAY['Houston','TX'], ARRAY['Phoenix','AZ'], ARRAY['Philadelphia','PA'],
    ARRAY['San Antonio','TX'], ARRAY['San Diego','CA'], ARRAY['Dallas','TX'],
    ARRAY['Austin','TX'], ARRAY['Seattle','WA'], ARRAY['Denver','CO'],
    ARRAY['Boston','MA'], ARRAY['Atlanta','GA'], ARRAY['Miami','FL'],
    ARRAY['Portland','OR'], ARRAY['Minneapolis','MN'], ARRAY['Nashville','TN'],
    ARRAY['Brooklyn','NY'], ARRAY['Oakland','CA']
  ];
  products text[][] := ARRAY[
    ARRAY['3017620422003','Nutella Hazelnut Spread','Ferrero','45'],
    ARRAY['5449000000996','Coca-Cola Classic 330ml','Coca-Cola','22'],
    ARRAY['7622210449283','Oreo Original Cookies','Mondelez','38'],
    ARRAY['0028400090315','Doritos Nacho Cheese','Frito-Lay','29'],
    ARRAY['0038000138416','Pringles Original','Kelloggs','31'],
    ARRAY['0044000032029','Cheez-It Original','Kelloggs','42'],
    ARRAY['0016000275287','Honey Nut Cheerios','General Mills','58'],
    ARRAY['0030000065112','Quaker Oats Old Fashioned','Quaker','88'],
    ARRAY['0021908735580','Greek Gods Honey Yogurt','Greek Gods','71'],
    ARRAY['0070038649571','Goldfish Crackers Cheddar','Pepperidge Farm','48'],
    ARRAY['3337875588225','Anthelios UVMune 400 SPF50+','La Roche-Posay','82'],
    ARRAY['8801051469141','Beauty of Joseon Relief Sun','Beauty of Joseon','89'],
    ARRAY['3574661103877','CeraVe Moisturizing Cream','CeraVe','85'],
    ARRAY['5060492930006','The Ordinary Niacinamide 10%','The Ordinary','83'],
    ARRAY['0381371177158','Nivea Cocoa Butter Body Lotion','Nivea','64'],
    ARRAY['8809803683005','COSRX Snail 96 Mucin Essence','COSRX','86'],
    ARRAY['3401345287786','Bioderma Sensibio H2O','Bioderma','87'],
    ARRAY['0079400451309','Dove Original Antiperspirant','Dove','51']
  ];
  imgs text[] := ARRAY[
    'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.4.400.jpg',
    'https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.4.400.jpg',
    'https://images.openfoodfacts.org/images/products/762/221/044/9283/front_en.4.400.jpg'
  ];
  start_date timestamptz := '2026-03-15 00:00:00+00';
  total_days int := 82;
  day_offset int;
  scans_today int;
  i int;
  pi int;
  ci int;
BEGIN
  FOR day_offset IN 0..total_days LOOP
    scans_today := 3 + (day_offset * day_offset / 200) + (random() * 6)::int;
    FOR i IN 1..scans_today LOOP
      pi := 1 + (random() * (array_length(products,1)-1))::int;
      ci := 1 + (random() * (array_length(cities,1)-1))::int;
      INSERT INTO public.community_scans
        (barcode, product_name, brand, score, image_url, city, state, scan_timestamp, saved)
      VALUES (
        products[pi][1], products[pi][2], products[pi][3], products[pi][4]::int,
        imgs[1 + (random()*2)::int],
        cities[ci][1], cities[ci][2],
        start_date + (day_offset || ' days')::interval + (random() * 86400 || ' seconds')::interval,
        random() < 0.18
      );
    END LOOP;
  END LOOP;
END $$;
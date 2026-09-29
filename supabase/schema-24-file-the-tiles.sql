-- ===========================================================================
-- 24 — File the tiles under Tile
--
-- Run any time after schema-16. Safe to re-run.
--
-- WHY
-- The tile aisle contains no tiles. All 99 products in it are tile
-- ACCESSORIES -- 60 edging, 36 marble jamb, 2 membrane -- while the real
-- tiles sit in flooring. So the bathroom checklist's "Tile" stage, which
-- looks in the tile category, offered customers metal L-channel.
--
-- No amount of search tuning fixes that: the data says those tiles are
-- flooring. This says otherwise.
--
-- WHAT MOVES
--    44 to tile   every mosaic, and the two porcelain field tiles, all
--               sold by the square foot. No threshold, no countertop.
--    11 to tools  spacers, levelling wedges, a suction cup, a vibration
--               beater. Neither flooring nor tile: what you lay one with.
--
-- Every id is listed with its name so the list can be read before it is
-- run. Nothing is deleted and nothing else is touched; to undo, set
-- these ids back to 'flooring'.
--
-- NOTE ON FORMAT: the comma sits before the comment on each line. After
-- it, the comment swallows it, SQL reads the ids as one concatenated
-- string, and the update matches nothing while reporting success.
-- ===========================================================================

update public.products
   set category_id = 'tile',
       updated_at = now()
 where id in (
    'zn-v-marquina-marble-mosaic-sf',  -- "V" Marquina Marble Mosaic /SF
    'zn-v-wooden-grey-marble-mosaic-sf',  -- "V" Wooden Grey Marble Mosaic /SF
    'zn-v-wooden-grey-marble-mosaic-sf-2',  -- "V" Wooden Grey Marble Mosaic /SF
    'zn-v-carrara-marble-mosaic-sf',  -- "V"Carrara Marble Mosaic /SF
    'zn-v-opus-glass-mosaic-sf',  -- "V"Opus&Glass Mosaic /SF
    'zn-12x24-plata-perla-grigia-matte-rectified-glazed-procelain-tile-sf',  -- 12X24 Plata Perla Grigia Matte Rectified Glazed Procelain Ti
    'zn-24x24-plata-perla-grigia-matte-rectified-glazed-procelain-tile-sf',  -- 24X24 Plata Perla Grigia Matte Rectified Glazed Procelain Ti
    'zn-2in-plata-perla-grigia-hexagon-polished-glazed-porcelain-mosaic-sf',  -- 2IN Plata Perla Grigia Hexagon Polished Glazed Porcelain Mos
    'zn-2in-soho-retro-black-hexagon-matte-glazed-procelain-mosaic-sf',  -- 2IN Soho Retro Black Hexagon Matte Glazed Procelain Mosaic /
    'zn-beige-flower-mosaic-sf',  -- Beige Flower Mosaic /SF
    'zn-beige-m-hexagon-mosaic-sf',  -- Beige M/Hexagon Mosaic /SF
    'zn-carrara-flower-mosaic-sf',  -- Carrara Flower Mosaic /SF
    'zn-carrara-m-hexagon-mosaic-sf',  -- Carrara M/Hexagon Mosaic /SF
    'zn-grey-white-diamond-marble-mosaic-sf',  -- Grey&White Diamond Marble Mosaic /SF
    'zn-grey-white-square-marble-mosaic-sf',  -- Grey&White Square Marble Mosaic /SF
    'zn-hexagon-2-super-white-unglazed-mosaic-sf',  -- Hexagon 2" Super White Unglazed Mosaic /SF
    'zn-hexagon-black-matte-mosaic-sf',  -- Hexagon Black Matte Mosaic /SF
    'zn-hexagon-black-gold-mosaic-sf',  -- Hexagon Black&Gold Mosaic /SF
    'zn-hexagon-carrara-white-procelain-mosaic-sf',  -- Hexagon Carrara White Procelain Mosaic /SF
    'zn-hexagon-grey-matte-mosaic-sf',  -- Hexagon Grey Matte Mosaic /SF
    'zn-hexagon-grey-tile-mosaic-sf',  -- Hexagon Grey Tile Mosaic /SF
    'zn-hexagon-grey-white-marble-mosaic-sf',  -- Hexagon Grey&White Marble Mosaic /SF
    'zn-hexagon-marble-carara-mosaic-sf',  -- Hexagon Marble Carara Mosaic /SF
    'zn-hexagon-wooden-grey-mosaic-sf',  -- Hexagon Wooden Grey Mosaic /SF
    'zn-lattice-mosaic-sf',  -- Lattice Mosaic /SF
    'zn-linear-irregular-mosaics-hu-vk-wht-ln-irr-pl-sf',  -- Linear Irregular Mosaics (Hu.Vk.Wht.Ln.Irr.Pl) /SF
    'zn-marble-mosaic-carrara-bianco-2-4-sf',  -- Marble Mosaic Carrara&Bianco 2*4 /SF
    'zn-marble-mosaic-crema-2-4-sf',  -- Marble Mosaic Crema 2*4 /SF
    'zn-marble-mosaic-volakas-white-sf',  -- Marble Mosaic Volakas White /SF
    'zn-marble-mosaic-volakas-white-2-4-sf',  -- Marble Mosaic Volakas White 2*4 /SF
    'zn-marquina-m-hexagon-mosaic-sf',  -- Marquina M/Hexagon Mosaic /SF
    'zn-opus-mosaic-2-4-sf',  -- Opus Mosaic 2*4 /SF
    'zn-pebble-marble-mosaic-sf',  -- Pebble Marble Mosaic /SF
    'zn-small-marquina-m-hexagon-mosaic-sf',  -- Small Marquina M/Hexagon Mosaic /SF
    'zn-stone-pebble-mosaic-sf-2',  -- Stone Pebble Mosaic /SF
    'zn-stone-pebble-mosaic-sf',  -- Stone Pebble Mosaic /SF
    'zn-striped-brick-weave-mosaic-sf',  -- Striped Brick Weave Mosaic /SF
    'zn-wave-grey-white-marble-mosaic-sf',  -- Wave Grey&White Marble Mosaic /SF
    'zn-weave-white-black-marble-mosaic-sf',  -- Weave White&Black Marble Mosaic /SF
    'zn-weave-white-brown-marble-mosaic-sf',  -- Weave White&Brown Marble Mosaic /SF
    'zn-white-magnolia-marble-mosaic-sf',  -- White Magnolia Marble Mosaic /SF
    'zn-white-black-diamond-marble-mosaic-sf',  -- White&Black Diamond Marble Mosaic /SF
    'zn-wooden-grey-mosaic-2-4-sf',  -- Wooden Grey Mosaic 2*4 /SF
    'zn-wooden-grey-s-hexagon-mosaic-sf'  -- Wooden Grey S/Hexagon Mosaic /SF
 );

update public.products
   set category_id = 'tools',
       updated_at = now()
 where id in (
    'zn-1-16-1-5-mm-tile-spacer-200-pcs',  -- 1/16'' (1.5 MM) Tile Spacer (200 PCS)
    'zn-1-16-2-mm-l-type-tile-spacer-200-pcs',  -- 1/16'' (2 MM) L-Type Tile Spacer (200 PCS)
    'zn-1-16-tile-levelling-base-100pcs',  -- 1/16'' Tile Levelling Base 100PCS
    'zn-1-4-6-mm-tile-spacer-200-pcs',  -- 1/4'' (6 MM) Tile Spacer (200 PCS)
    'zn-1-8-3-mm-tile-spacer-200-pcs',  -- 1/8'' (3 MM) Tile Spacer (200 PCS)
    'zn-3-16-5-mm-tile-spacer-200-pcs',  -- 3/16'' (5 MM) Tile Spacer (200 PCS)
    'zn-5-32-4-mm-type-tile-spacer-100-pcs',  -- 5/32'' (4 MM) Type Tile Spacer (100 PCS)
    'zn-cordless-vibration-tile-beater',  -- Cordless Vibration Tile Beater
    'zn-reusable-tile-leveling-system-50-sets',  -- Reusable Tile Leveling System 50 Sets
    'zn-tile-levelling-wedges-100pcs',  -- Tile Levelling Wedges 100PCS
    'zn-tooltech-xpert-8-220lb-black-plastic-tile-suction-cup'  -- Tooltech Xpert 8" 220LB Black Plastic Tile Suction Cup
 );

-- What the aisles hold afterwards, so the run can be checked rather than
-- assumed. Expect tile to rise by 44 and flooring to fall by 55.
select category_id, count(*) as products
  from public.products
 where is_active and category_id in ('tile', 'flooring', 'tools')
 group by category_id
 order by category_id;

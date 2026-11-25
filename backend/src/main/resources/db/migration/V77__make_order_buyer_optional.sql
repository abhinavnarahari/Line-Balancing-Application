-- V77: an order's buyer is optional (like the style's buyer). Only relaxes NOT NULL; no data changes.
ALTER TABLE orders ALTER COLUMN buyer DROP NOT NULL;

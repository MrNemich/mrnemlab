-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    avatar_url TEXT,
    wallet_address VARCHAR(255),
    balance DECIMAL(18, 9) DEFAULT 0.0,
    total_volume DECIMAL(18, 9) DEFAULT 0.0,
    bought_count INTEGER DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NFT Collections table
CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NFT Backgrounds table
CREATE TABLE IF NOT EXISTS backgrounds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color_code VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NFT Items table
CREATE TABLE IF NOT EXISTS nfts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    collection_id INTEGER REFERENCES collections(id),
    background_id INTEGER REFERENCES backgrounds(id),
    price DECIMAL(18, 9) NOT NULL,
    image_url TEXT,
    owner_id BIGINT REFERENCES users(id) DEFAULT NULL,
    is_listed BOOLEAN DEFAULT true,
    rarity VARCHAR(50),
    attributes JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    nft_id BIGINT REFERENCES nfts(id),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    purchase_price DECIMAL(18, 9),
    UNIQUE(user_id, nft_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- 'deposit', 'withdraw', 'buy', 'sell'
    amount DECIMAL(18, 9) NOT NULL,
    nft_id BIGINT REFERENCES nfts(id),
    tx_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    telegram_payment_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Telegram Payments table
CREATE TABLE IF NOT EXISTS telegram_payments (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    amount DECIMAL(18, 9),
    currency VARCHAR(10),
    status VARCHAR(50),
    telegram_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert collections
INSERT INTO collections (name, description) VALUES 
('Bodded Ring', 'Exclusive ring collection'),
('Candle Lamp', 'Lighting artifacts'),
('Boots', 'Footwear collection'),
('Candy Cane', 'Sweet treats'),
('Case', 'Protective cases'),
('Christmas Tree', 'Holiday collection'),
('Clover Pin', 'Lucky charms'),
('Crystal Ball', 'Magical items'),
('Diamond Ring', 'Premium jewelry'),
('Durov''s Coat', 'Exclusive Durov items'),
('Coconut', 'Tropical collection'),
('Crystal Eagle', 'Bird figurines'),
('Dove of Peace', 'Peace symbols'),
('Durov''s Figurine', 'Collectible figurines'),
('Coffin', 'Mystical items'),
('Cupid Charm', 'Love charms'),
('Durov''s Boots', 'Footwear collection'),
('Durov''s Sunglasses', 'Accessories'),
('Cookie Heart', 'Sweet collection'),
('Desk Calendar', 'Office items'),
('Durov''s Cap', 'Headwear'),
('Easter Cake', 'Holiday collection'),
('Evil Eye', 'Protective items'),
('Faith Amulet', 'Religious items'),
('Flying Broom', 'Magical transport'),
('Gem Signet', 'Jewelry'),
('Genie Lamp', 'Magical items'),
('Ginger Cookie', 'Sweet treats'),
('Hanging Star', 'Celestial items'),
('Happy Brownie', 'Desserts'),
('Heart Locket', 'Jewelry'),
('Heroic Helmet', 'Armor'),
('Holiday Drink', 'Beverages'),
('Homemade Cake', 'Desserts'),
('Ice Cream Cone', 'Sweet treats'),
('Ice Cream Scoops', 'Desserts'),
('Input Key', 'Tech items'),
('lon Gem', 'Gemstones'),
('lonic Dryer', 'Tech items'),
('Jack in the Box', 'Toys'),
('Kissed Frog', 'Fairy tale items'),
('Kitty Medallion', 'Animal jewelry'),
('Lol Pop', 'Candy'),
('Loot Bag', 'Gaming items'),
('Love Candle', 'Romantic items'),
('Love Potion', 'Magical beverages'),
('Low Rider', 'Vehicle collection'),
('Lunar Snake', 'Celestial animals'),
('Lush Bouquet', 'Floral collection'),
('Mask', 'Face coverings'),
('Medal', 'Awards'),
('Mighty Arm', 'Body parts'),
('Mouse Cake', 'Desserts'),
('Party Sparkler', 'Celebration items'),
('Pink Flamingo', 'Animal figurines'),
('Mini Oscar', 'Awards'),
('Money Pot', 'Financial items'),
('Neko Helmet', 'Anime items'),
('Perfume Bottle', 'Fragrances'),
('Priccious Peach', 'Fruit collection'),
('Pretty Posy', 'Floral arrangements'),
('Moon Pendant', 'Jewelry'),
('Record Player', 'Music items'),
('Red Star', 'Symbols'),
('Resistance Dog', 'Animal collection'),
('Restless Jar', 'Mystical containers'),
('Roses', 'Floral collection'),
('Sakura Flower', 'Japanese collection'),
('Sandcastle', 'Beach items'),
('Santa Hat', 'Holiday wear'),
('Sky Stilettos', 'Footwear'),
('Sleigh Bell', 'Holiday items'),
('Snake Box', 'Mystical containers'),
('Snoop Cigar', 'Celebrity items'),
('Snoop Dogg', 'Celebrity collection'),
('Snow Globe', 'Holiday decor'),
('Snow Mittens', 'Winter wear'),
('Spiced Wine', 'Beverages'),
('Statue of Liberty', 'Landmark collection'),
('Stellar Rocket', 'Space items'),
('Surfboard', 'Sports equipment'),
('Star Notepad', 'Office supplies'),
('Swag Bag', 'Fashion accessories'),
('Swiss Watch', 'Timepieces'),
('Tornh of Freedom', 'Symbolic items'),
('Telegram Pin', 'Branded items'),
('Top Hat', 'Headwear'),
('Total Horse', 'Animal collection'),
('UFC Strike', 'Sports items'),
('Valentine Box', 'Romantic gifts'),
('Vintage Cigar', 'Collectibles'),
('Voodoo Doll', 'Mystical items'),
('Wrestide Sign', 'Signage'),
('Whip Cupcake', 'Desserts'),
('Winter Wreath', 'Holiday decor'),
('Witch Hat', 'Magical wear'),
('Xmas Stocking', 'Holiday items')
ON CONFLICT (name) DO NOTHING;

-- Insert backgrounds
INSERT INTO backgrounds (name, color_code) VALUES 
('Amber', '#FFBF00'),
('Aquamarine', '#7FFFD4'),
('Azure Blue', '#007FFF'),
('Battleship Grey', '#848482'),
('Black', '#000000'),
('Burgundy', '#800020'),
('Deep Cyan', '#008B8B'),
('Desert Sand', '#EDC9AF'),
('Electric Indigo', '#6F00FF'),
('Electric Purple', '#BF00FF'),
('Emerald', '#50C878'),
('English Violet', '#563C5C'),
('Fandango', '#B53389'),
('Navy Blue', '#000080'),
('Neon Blue', '#4666FF'),
('Onyx Black', '#353839'),
('Old Gold', '#CFB53B'),
('Orange', '#FFA500'),
('Pacific Cyan', '#00A4C1'),
('Pacific Green', '#1CA9C9'),
('Persimmon', '#EC5800'),
('Pine Green', '#01796F')
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_nfts_collection_id ON nfts(collection_id);
CREATE INDEX idx_nfts_background_id ON nfts(background_id);
CREATE INDEX idx_nfts_owner_id ON nfts(owner_id);
CREATE INDEX idx_nfts_is_listed ON nfts(is_listed);
CREATE INDEX idx_inventory_user_id ON inventory(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);

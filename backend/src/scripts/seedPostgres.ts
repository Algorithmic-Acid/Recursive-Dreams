import dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/postgres';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting PostgreSQL database seeding...\n');

    // Create suppliers
    console.log('Creating suppliers...');
    const supplierResult = await db.query(`
      INSERT INTO suppliers (name, contact_email, lead_time_days, minimum_order_quantity)
      VALUES
        ('AudioTech Supply Co', 'orders@audiotech.example.com', 14, 10),
        ('Digital Dreams Distribution', 'sales@digitaldreams.example.com', 3, 1),
        ('Hardware Hub Inc', 'wholesale@hardwarehub.example.com', 21, 5),
        ('Apparel Express', 'orders@apparelexpress.example.com', 10, 20)
      RETURNING id, name
    `);
    console.log(`✅ Created ${supplierResult.rows.length} suppliers`);

    const suppliers = supplierResult.rows;
    const audioSupplier = suppliers.find(s => s.name.includes('AudioTech'));
    const digitalSupplier = suppliers.find(s => s.name.includes('Digital'));
    const hardwareSupplier = suppliers.find(s => s.name.includes('Hardware'));
    const apparelSupplier = suppliers.find(s => s.name.includes('Apparel'));

    // Create products
    console.log('\nCreating products...');

    const products = [
      // Digital - Soundscapes
      {
        name: 'Cosmic Void Ambience',
        slug: 'cosmic-void-ambience',
        category: 'soundscapes',
        type: 'digital',
        price: 14.99,
        description: 'Deep space ambient soundscape perfect for meditation and focus',
        icon: '🌌',
        stock: 9999,
        threshold: 1,
        optimal: 9999,
        supplier: digitalSupplier?.id,
        cost: 0,
      },
      {
        name: 'Algorithmic Dreams Pack',
        slug: 'algorithmic-dreams-pack',
        category: 'soundscapes',
        type: 'digital',
        price: 24.99,
        description: 'AI-generated evolving soundscapes that never repeat',
        icon: '🎵',
        stock: 9999,
        threshold: 1,
        optimal: 9999,
        supplier: digitalSupplier?.id,
        cost: 0,
      },

      // Digital - Templates
      {
        name: 'Ableton Acid Template Pack',
        slug: 'ableton-acid-template-pack',
        category: 'templates',
        type: 'digital',
        price: 39.99,
        description: 'Professional acid house templates for Ableton Live',
        icon: '🎹',
        stock: 9999,
        threshold: 1,
        optimal: 9999,
        supplier: digitalSupplier?.id,
        cost: 0,
      },

      // Digital - Music
      {
        name: 'Neon Void - Full Album',
        slug: 'neon-void-full-album',
        category: 'music',
        type: 'digital',
        price: 12.99,
        description: 'Complete album of experimental electronic music',
        icon: '💿',
        stock: 9999,
        threshold: 1,
        optimal: 9999,
        supplier: digitalSupplier?.id,
        cost: 0,
      },

      // Digital - Software
      {
        name: 'Void Synth VST Plugin',
        slug: 'void-synth-vst',
        category: 'software',
        type: 'digital',
        price: 79.99,
        description: 'Advanced synthesizer plugin with AI-powered sound design',
        icon: '🔌',
        stock: 9999,
        threshold: 1,
        optimal: 9999,
        supplier: digitalSupplier?.id,
        cost: 0,
      },
      {
        name: 'Digital Rot',
        slug: 'digital-rot',
        category: 'software',
        type: 'digital',
        price: 25.00,
        description: 'Your DAW is too clean. It lies to you. Digital Rot is the truth—the sound of your hard drive dying, your stream buffering, your memories corrupting. We modeled a scratched CD-ROM from 1999, a 56k modem screaming in a thunderstorm, and the void itself.',
        icon: '💀',
        stock: 9999,
        threshold: 1,
        optimal: 9999,
        supplier: digitalSupplier?.id,
        cost: 0,
        metadata: {
          pricing_variants: [
            {
              id: 'standard',
              name: 'Pay $25',
              price: 25.00,
              description: 'Support the void'
            },
            {
              id: 'steal',
              name: 'Steal It',
              price: 0,
              description: 'Take it for free, no judgment'
            }
          ],
          download_file: 'DigitalRot.zip',
          is_downloadable: true
        }
      },
      {
        name: 'VHS Tracker',
        slug: 'vhs-tracker',
        category: 'software',
        type: 'digital',
        price: 15.00,
        description: 'Emulates a VCR losing its tracking — the sound of actual failure. Horizontal dropout lines, color bleeding, tape hiss/rumble, and random sync loss glitches. 4 controls: Tracking Instability, Head Wear, Tape Age, Signal Strength.',
        icon: '📼',
        stock: 9999,
        threshold: 1,
        optimal: 9999,
        supplier: digitalSupplier?.id,
        cost: 0,
        metadata: {
          pricing_variants: [
            {
              id: 'pay',
              name: 'Pay $15',
              price: 15.00,
              description: 'Support the void'
            },
            {
              id: 'steal',
              name: 'Steal It',
              price: 0,
              description: 'Take it for free, no judgment'
            }
          ],
          download_file: 'VHSTracker.zip',
          is_downloadable: true
        }
      },

      // Physical - Shirts
      {
        name: 'Algorithmic Acid T-Shirt',
        slug: 'algorithmic-acid-tshirt',
        category: 'shirts',
        type: 'physical',
        price: 29.99,
        description: 'Premium cotton t-shirt with unique acid-inspired design',
        icon: '👕',
        stock: 45,
        threshold: 10,
        optimal: 50,
        supplier: apparelSupplier?.id,
        cost: 12.00,
      },
      {
        name: 'Void Vendor Logo Tee',
        slug: 'void-vendor-logo-tee',
        category: 'shirts',
        type: 'physical',
        price: 24.99,
        description: 'Classic fit tee with embroidered Void Vendor logo',
        icon: '👕',
        stock: 32,
        threshold: 15,
        optimal: 60,
        supplier: apparelSupplier?.id,
        cost: 10.00,
      },

      // Physical - Hoodies
      {
        name: 'Cosmic Void Hoodie',
        slug: 'cosmic-void-hoodie',
        category: 'hoodies',
        type: 'physical',
        price: 59.99,
        description: 'Ultra-soft hoodie with galaxy print design',
        icon: '🧥',
        stock: 18,
        threshold: 8,
        optimal: 30,
        supplier: apparelSupplier?.id,
        cost: 28.00,
      },

      // Physical - Pants
      {
        name: 'Tech Joggers - Black',
        slug: 'tech-joggers-black',
        category: 'pants',
        type: 'physical',
        price: 49.99,
        description: 'Comfortable joggers perfect for studio sessions',
        icon: '👖',
        stock: 22,
        threshold: 10,
        optimal: 40,
        supplier: apparelSupplier?.id,
        cost: 22.00,
      },

      // Physical - Effects Pedals
      {
        name: 'Acid Filter Pro Pedal',
        slug: 'acid-filter-pro-pedal',
        category: 'effects_pedals',
        type: 'physical',
        price: 199.99,
        description: 'Analog filter pedal inspired by classic 303 sound',
        icon: '🎛️',
        stock: 8,
        threshold: 5,
        optimal: 15,
        supplier: hardwareSupplier?.id,
        cost: 95.00,
      },
      {
        name: 'Void Reverb Deluxe',
        slug: 'void-reverb-deluxe',
        category: 'effects_pedals',
        type: 'physical',
        price: 249.99,
        description: 'Spacious reverb pedal with shimmer and modulation',
        icon: '🎛️',
        stock: 5,
        threshold: 3,
        optimal: 12,
        supplier: hardwareSupplier?.id,
        cost: 120.00,
      },

      // Physical - MIDI Controllers
      {
        name: 'Grid Controller 64',
        slug: 'grid-controller-64',
        category: 'midi_controllers',
        type: 'physical',
        price: 299.99,
        description: '8x8 RGB pad controller with pressure sensitivity',
        icon: '🎹',
        stock: 12,
        threshold: 6,
        optimal: 20,
        supplier: hardwareSupplier?.id,
        cost: 145.00,
      },

      // Physical - Synthesizers
      {
        name: 'Pocket Acid Synth',
        slug: 'pocket-acid-synth',
        category: 'synthesizers',
        type: 'physical',
        price: 399.99,
        description: 'Portable monophonic synthesizer with sequencer',
        icon: '🎼',
        stock: 6,
        threshold: 4,
        optimal: 15,
        supplier: audioSupplier?.id,
        cost: 180.00,
      },
      {
        name: 'Modular Void System Starter',
        slug: 'modular-void-system',
        category: 'synthesizers',
        type: 'physical',
        price: 899.99,
        description: 'Complete modular synthesis starter kit',
        icon: '🎼',
        stock: 3,
        threshold: 2,
        optimal: 8,
        supplier: audioSupplier?.id,
        cost: 420.00,
      },
    ];

    for (const product of products) {
      await db.query(
        `INSERT INTO products (
          name, slug, category, product_type, price, description, icon,
          stock_quantity, low_stock_threshold, optimal_stock_level,
          supplier_id, cost_price, sku, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          product.name,
          product.slug,
          product.category,
          product.type,
          product.price,
          product.description,
          product.icon,
          product.stock,
          product.threshold,
          product.optimal,
          product.supplier || null,
          product.cost,
          product.slug.toUpperCase().replace(/-/g, ''),
          JSON.stringify((product as any).metadata || {}),
        ]
      );
    }

    console.log(`✅ Created ${products.length} products`);

    // Create admin user
    console.log('\nCreating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await db.query(
      `INSERT INTO users (email, password_hash, name, is_admin)
       VALUES ($1, $2, $3, $4)`,
      ['admin@voidvendor.com', adminPassword, 'Admin User', true]
    );
    console.log('✅ Created admin user (admin@voidvendor.com / admin123)');

    // Create test user
    const userPassword = await bcrypt.hash('test123', 10);
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['test@example.com', userPassword, 'Test User']
    );
    console.log('✅ Created test user (test@example.com / test123)');

    const testUserId = userResult.rows[0].id;

    // Create sample orders to generate sales data
    console.log('\nCreating sample orders...');

    const productIds = await db.query('SELECT id FROM products LIMIT 5');

    for (let i = 0; i < 10; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      const orderNumber = `ORD-SEED-${Date.now()}-${i}`;

      const orderResult = await db.query(
        `INSERT INTO orders (
          user_id, order_number, total_amount, status, payment_status,
          payment_method, shipping_full_name, shipping_address,
          shipping_city, shipping_state, shipping_zip_code, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id`,
        [
          testUserId,
          orderNumber,
          0, // Will be calculated
          'delivered',
          'paid',
          'card',
          'Test User',
          '123 Test Street',
          'Test City',
          'CA',
          '90210',
          orderDate,
        ]
      );

      const orderId = orderResult.rows[0].id;

      // Add 1-3 random items to order
      const numItems = Math.floor(Math.random() * 3) + 1;
      let orderTotal = 0;

      for (let j = 0; j < numItems; j++) {
        const randomProduct = productIds.rows[Math.floor(Math.random() * productIds.rows.length)];
        const productData = await db.query('SELECT * FROM products WHERE id = $1', [randomProduct.id]);
        const product = productData.rows[0];

        const quantity = Math.floor(Math.random() * 3) + 1;
        const itemTotal = parseFloat(product.price) * quantity;
        orderTotal += itemTotal;

        await db.query(
          `INSERT INTO order_items (
            order_id, product_id, product_name, product_icon,
            quantity, unit_price, total_price, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            orderId,
            product.id,
            product.name,
            product.icon,
            quantity,
            product.price,
            itemTotal,
            orderDate,
          ]
        );
      }

      // Update order total
      await db.query('UPDATE orders SET total_amount = $1 WHERE id = $2', [orderTotal, orderId]);
    }

    console.log('✅ Created 10 sample orders');

    // Initialize sales velocity
    console.log('\nInitializing sales velocity data...');
    await db.query(`
      INSERT INTO sales_velocity (
        product_id,
        sales_last_7_days,
        sales_last_30_days,
        sales_last_90_days,
        avg_daily_sales_7d,
        avg_daily_sales_30d,
        avg_daily_sales_90d,
        trend_direction
      )
      SELECT
        p.id,
        0, 0, 0, 0, 0, 0, 'stable'
      FROM products p
      ON CONFLICT (product_id) DO NOTHING
    `);
    console.log('✅ Initialized sales velocity tracking');

    // Seed free downloads (VST plugins)
    console.log('\nCreating free downloads...');
    const freeDownloads = [
      {
        name: 'Formant Filter',
        slug: 'formant-filter',
        description: 'Vowel-shaping formant filter for creating vocal-like resonances and electronic voice effects',
        version: '1.0.0',
        fileSize: '2.1 MB',
        filename: 'FormantFilter.zip',
        platform: ['Windows'],
      },
      {
        name: 'Lo-Fi Degrader',
        slug: 'lofi-degrader',
        description: 'Bit-crushing and sample rate reduction for vintage lo-fi vibes and retro digital textures',
        version: '1.0.0',
        fileSize: '1.8 MB',
        filename: 'LoFiDegrader.zip',
        platform: ['Windows'],
      },
      {
        name: 'Tape Wobble',
        slug: 'tape-wobble',
        description: 'Analog tape warble and flutter emulation for warm, nostalgic tape machine character',
        version: '1.0.0',
        fileSize: '1.9 MB',
        filename: 'TapeWobble.zip',
        platform: ['Windows'],
      },
      {
        name: 'GrainStorm',
        slug: 'grainstorm',
        description: 'Granular synthesis effect for transforming audio into evolving textures, glitches, and atmospheric soundscapes',
        version: '1.0.0',
        fileSize: '1.9 MB',
        filename: 'GrainStorm.zip',
        platform: ['Windows'],
      },
    ];

    for (const download of freeDownloads) {
      await db.query(
        `INSERT INTO free_downloads (name, slug, description, version, file_size, filename, platform, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           version = EXCLUDED.version,
           file_size = EXCLUDED.file_size,
           filename = EXCLUDED.filename,
           platform = EXCLUDED.platform`,
        [download.name, download.slug, download.description, download.version, download.fileSize, download.filename, download.platform]
      );
    }
    console.log(`✅ Created ${freeDownloads.length} free downloads`);

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`- ${supplierResult.rows.length} suppliers`);
    console.log(`- ${products.length} products`);
    console.log(`- ${freeDownloads.length} free VST downloads`);
    console.log('- 2 users (1 admin, 1 test)');
    console.log('- 10 sample orders');
    console.log('\nYou can now:');
    console.log('1. Login as admin: admin@voidvendor.com / admin123');
    console.log('2. Login as test user: test@example.com / test123');
    console.log('3. Generate AI forecasts: POST /api/inventory/forecast');
    console.log('4. View inventory dashboard: GET /api/inventory/dashboard');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

const runSeed = async () => {
  try {
    await db.connect();
    await seedDatabase();
    await db.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
};

runSeed();

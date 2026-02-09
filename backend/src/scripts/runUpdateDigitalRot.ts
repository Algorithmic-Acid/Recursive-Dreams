import dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/postgres';

const runUpdate = async () => {
  try {
    await db.connect();

    console.log('Updating Void Mod pricing variants...');

    const result = await db.query(`
      UPDATE products
      SET metadata = '{"pricing_variants": [{"id": "pay", "name": "Pay $25", "price": 25.00, "description": "Support the void"}, {"id": "steal", "name": "Steal It", "price": 0, "description": "Take it for free, no judgment"}], "download_file": "VoidMod.zip", "is_downloadable": true}'::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE slug = 'void-mod'
      RETURNING name, slug, metadata
    `);

    if (result.rows.length > 0) {
      console.log('✅ Void Mod updated successfully!');
      console.log('New metadata:', JSON.stringify(result.rows[0].metadata, null, 2));
    } else {
      console.log('⚠️ No product found with slug "void-mod"');
    }

    await db.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating Void Mod:', error);
    process.exit(1);
  }
};

runUpdate();

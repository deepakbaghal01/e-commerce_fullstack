const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('../models/Product');
const User = require('../models/User');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const demoProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'Comfortable over-ear headphones with rich sound and a long-lasting battery for commutes, work, and relaxing at home.',
    price: 2499,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=85',
    rating: 4.5,
    stock: 24
  },
  {
    name: 'Everyday Smart Watch',
    description: 'A versatile smartwatch for checking notifications, tracking daily activity, and keeping your routine on track.',
    price: 3999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=85',
    rating: 4.4,
    stock: 18
  },
  {
    name: 'Classic Cotton T-Shirt',
    description: 'A soft, easy-to-style cotton tee made for comfortable everyday wear. Pair it with your favourite jeans or shorts.',
    price: 799,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=85',
    rating: 4.3,
    stock: 40
  },
  {
    name: 'Relaxed Fit Denim Jeans',
    description: 'A timeless denim staple with a comfortable fit that works just as well for a casual day out as it does at home.',
    price: 1899,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=85',
    rating: 4.4,
    stock: 22
  },
  {
    name: 'Everyday Running Shoes',
    description: 'Lightweight, cushioned shoes for daily walks, easy runs, and busy days on your feet.',
    price: 2799,
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=85',
    rating: 4.6,
    stock: 16
  },
  {
    name: 'Polarized Sunglasses',
    description: 'Classic-frame sunglasses with polarized lenses for comfortable wear on bright days.',
    price: 1299,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=85',
    rating: 4.2,
    stock: 30
  },
  {
    name: 'Minimal Table Lamp',
    description: 'A simple, modern accent lamp that adds a warm touch to a bedside table, reading nook, or desk.',
    price: 1599,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=85',
    rating: 4.3,
    stock: 14
  },
  {
    name: 'Soft Woven Throw Blanket',
    description: 'A cosy, textured throw for adding an extra layer of comfort to your sofa or favourite chair.',
    price: 1199,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=85',
    rating: 4.5,
    stock: 20
  },
  {
    name: 'Compact Wireless Mouse',
    description: 'A comfortable wireless mouse with a compact shape for a tidy desk setup or taking along in your bag.',
    price: 899,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&auto=format&fit=crop&q=85',
    rating: 4.3,
    stock: 28
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: 'A small, easy-to-carry speaker for listening to your favourite playlists at home or outdoors.',
    price: 1799,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=85',
    rating: 4.4,
    stock: 19
  },
  {
    name: 'Everyday Zip-Up Hoodie',
    description: 'A soft layering piece with a relaxed fit, handy front pockets, and an easy zip-up front.',
    price: 1699,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&auto=format&fit=crop&q=85',
    rating: 4.5,
    stock: 26
  },
  {
    name: 'Canvas Weekend Backpack',
    description: 'A practical everyday backpack with room for your daily essentials, books, and a water bottle.',
    price: 2199,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=85',
    rating: 4.4,
    stock: 17
  },
  {
    name: 'Leather Card Holder',
    description: 'A slim card holder designed to keep the essentials organised without adding bulk to your pocket.',
    price: 699,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=85',
    rating: 4.2,
    stock: 32
  },
  {
    name: 'Ceramic Coffee Mug Set',
    description: 'A pair of simple ceramic mugs for coffee, tea, or a quiet morning at home.',
    price: 599,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&auto=format&fit=crop&q=85',
    rating: 4.6,
    stock: 21
  },
  {
    name: 'Decorative Cushion Cover',
    description: 'A textured cushion cover that brings a soft, relaxed accent to a sofa, bed, or reading chair.',
    price: 499,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=85',
    rating: 4.3,
    stock: 35
  },
  {
    name: 'Lightweight Walking Sneakers',
    description: 'Easygoing sneakers with a cushioned feel for errands, city walks, and everyday plans.',
    price: 2399,
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?w=800&auto=format&fit=crop&q=85',
    rating: 4.4,
    stock: 15
  },
  {
    name: 'Diwali Brass Diya Set',
    description: 'A set of traditional brass diyas for creating a warm festive glow at home. Use with care and keep lit diyas away from children and flammable materials.',
    price: 899,
    compareAtPrice: 1199,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=85',
    rating: 4.6,
    stock: 24
  },
  {
    name: 'Festive String Lights',
    description: 'Warm white decorative string lights to add a welcoming glow to a balcony, doorway, or festive table display.',
    price: 699,
    compareAtPrice: 999,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&auto=format&fit=crop&q=85',
    rating: 4.4,
    stock: 32
  },
  {
    name: 'Rangoli Art Starter Kit',
    description: 'A colourful rangoli starter kit for creating festive floor designs. Includes reusable stencils and assorted colours.',
    price: 449,
    compareAtPrice: 599,
    category: 'Other',
    image: 'https://images.unsplash.com/photo-1604608672516-5e4e6b9d8cf2?w=800&auto=format&fit=crop&q=85',
    rating: 4.3,
    stock: 18
  },
  {
    name: 'Festive Gift Hamper',
    description: 'A ready-to-gift festive hamper with a decorative keepsake box and a curated selection of seasonal treats.',
    price: 1499,
    compareAtPrice: 1899,
    category: 'Other',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=85',
    rating: 4.7,
    stock: 12
  },
  {
    name: 'Over-Ear Studio Headphones',
    description: 'Comfortable padded headphones with clear, balanced sound for music, calls, and focused listening.',
    price: 3299,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=85',
    rating: 4.5,
    stock: 18
  },
  {
    name: 'Mechanical Wireless Keyboard',
    description: 'A compact wireless keyboard with tactile keys for a comfortable work or study setup.',
    price: 2899,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=85',
    rating: 4.4,
    stock: 14
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'A reusable insulated bottle for carrying water to work, class, or your next day out.',
    price: 749,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=85',
    rating: 4.3,
    stock: 36
  },
  {
    name: 'Everyday Crossbody Bag',
    description: 'A lightweight crossbody bag with room for daily essentials and an adjustable shoulder strap.',
    price: 1399,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop&q=85',
    rating: 4.5,
    stock: 20
  },
  {
    name: 'Linen Blend Summer Shirt',
    description: 'A breathable, relaxed-fit shirt that layers easily and feels comfortable on warm days.',
    price: 1299,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=85',
    rating: 4.2,
    stock: 25
  },
  {
    name: 'Classic Canvas Sneakers',
    description: 'Simple lace-up canvas sneakers that pair easily with everyday outfits.',
    price: 1599,
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=85',
    rating: 4.3,
    stock: 23
  },
  {
    name: 'Wooden Serving Tray',
    description: 'A versatile wooden tray for serving drinks, arranging snacks, or keeping small items together.',
    price: 999,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1603199506016-b9a594b593c0?w=800&auto=format&fit=crop&q=85',
    rating: 4.4,
    stock: 17
  },
  {
    name: 'Scented Candle Trio',
    description: 'Three softly scented candles for creating a calm, welcoming atmosphere in your home.',
    price: 899,
    compareAtPrice: 1199,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=85',
    rating: 4.6,
    stock: 21
  },
  {
    name: 'Printed Cotton Scarf',
    description: 'A lightweight printed scarf that adds a comfortable, colourful layer to everyday outfits.',
    price: 599,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&auto=format&fit=crop&q=85',
    rating: 4.1,
    stock: 29
  }
];

const additionalProductGroups = [
  {
    category: 'Electronics',
    images: [
      'photo-1511707171634-5f897ff02aa9',
      'photo-1516035069371-29a1b244cc32',
      'photo-1593359677879-a4bb92f829d1',
      'photo-1592899677977-9c10ca588bbd',
      'photo-1498049794561-7780e7231661',
      'photo-1588872657578-7efd1f1555ed'
    ],
    items: [
      ['USB-C Fast Charger', 899, 32],
      ['Adjustable Phone Stand', 499, 28],
      ['Mirrorless Travel Camera', 28999, 8],
      ['Compact Android Smartphone', 14999, 15],
      ['Portable SSD Drive', 3999, 17],
      ['Slim Laptop Sleeve', 1199, 24],
      ['Noise-Isolating Earbuds', 1799, 21],
      ['HD Streaming Monitor', 8999, 10],
      ['Rechargeable Desk Fan', 1499, 18],
      ['Smart Home Plug', 999, 26],
      ['USB-C Hub Adapter', 1699, 20],
      ['Portable Power Bank', 1899, 23]
    ]
  },
  {
    category: 'Clothing',
    images: [
      'photo-1529139574466-a303027c1d8b',
      'photo-1483985988355-763728e1935b',
      'photo-1551232864-3f0890e580d9',
      'photo-1551488831-00ddcb6c6bd3',
      'photo-1515886657613-9f3515b0c78f',
      'photo-1539109136881-3be0616acf4b'
    ],
    items: [
      ['Relaxed Linen Shirt', 1499, 24],
      ['Everyday Chino Trousers', 1799, 20],
      ['Lightweight Denim Jacket', 2499, 13],
      ['Classic Crewneck Sweatshirt', 1599, 22],
      ['Cotton Casual Dress', 1899, 16],
      ['Soft Knit Cardigan', 2199, 12],
      ['Printed Summer Top', 999, 28],
      ['Straight-Leg Cotton Pants', 1699, 18],
      ['Everyday Polo Shirt', 899, 31],
      ['Cozy Fleece Pullover', 1799, 15],
      ['Button-Down Oxford Shirt', 1399, 25],
      ['Lightweight Rain Jacket', 2699, 11]
    ]
  },
  {
    category: 'Shoes',
    images: [
      'photo-1543163521-1bf539c55dd2',
      'photo-1495555961986-6d4c1ecb7be3',
      'photo-1525966222134-fcfa99b8ae77',
      'photo-1542291026-7eec264c27ff',
      'photo-1460353581641-37baddab0fa2'
    ],
    items: [
      ['Everyday Slip-On Sneakers', 1799, 19],
      ['Classic Leather Loafers', 3199, 12],
      ['Canvas Low-Top Shoes', 1299, 27],
      ['Cushioned Gym Trainers', 2499, 16],
      ['Comfort Walking Sandals', 999, 22],
      ['Casual Lace-Up Boots', 2899, 10],
      ['Lightweight Running Shoes', 2699, 18],
      ['Minimal White Sneakers', 1999, 21],
      ['Everyday Ballet Flats', 1399, 14],
      ['Trail Walking Shoes', 3299, 9]
    ]
  },
  {
    category: 'Accessories',
    images: [
      'photo-1584917865442-de89df76afd3',
      'photo-1523170335258-f5ed11844a49',
      'photo-1524805444758-089113d48a6d',
      'photo-1506629905607-d9a4d8c3507b',
      'photo-1591047139829-d91aecb6caea',
      'photo-1572635196237-14b3f281503f'
    ],
    items: [
      ['Everyday Leather Belt', 899, 28],
      ['Minimal Analog Wristwatch', 2499, 13],
      ['Classic Dial Watch', 1999, 17],
      ['Soft Knit Winter Beanie', 499, 34],
      ['Lightweight Travel Pouch', 699, 25],
      ['Polarized Round Sunglasses', 1199, 20],
      ['Compact Zip Wallet', 999, 18],
      ['Woven Everyday Tote', 1299, 22],
      ['Patterned Silk-Feel Scarf', 749, 26],
      ['Simple Silver-Tone Necklace', 899, 15],
      ['Travel Organizer Set', 1099, 19]
    ]
  },
  {
    category: 'Home',
    images: [
      'photo-1616486338812-3dadae4b4ace',
      'photo-1494438639946-1ebd1d20bf85',
      'photo-1618221195710-dd6b41faaea6',
      'photo-1615874694520-474822394e73',
      'photo-1600210492486-724fe5c67fb0'
    ],
    items: [
      ['Textured Ceramic Planter', 799, 24],
      ['Cotton Cushion Cover Pair', 699, 29],
      ['Minimal Wall Art Print', 999, 18],
      ['Soft Cotton Bath Towel Set', 1299, 21],
      ['Wooden Photo Frame Set', 899, 17],
      ['Neutral Table Runner', 749, 23],
      ['Stackable Storage Basket', 1099, 16],
      ['Glass Water Carafe', 699, 20],
      ['Bedside Reading Light', 1399, 12],
      ['Woven Laundry Hamper', 1599, 14]
    ]
  },
  {
    category: 'Electronics',
    images: [
      'photo-1606220945770-b5b6c2c55bf1',
      'photo-1523206489230-c012c64b2b48',
      'photo-1583394838336-acd977736f90'
    ],
    items: [
      ['Wireless Noise-Cancelling Earbuds', 2299, 19],
      ['Foldable Laptop Stand', 1399, 16],
      ['Dual-Port USB-C Wall Charger', 1099, 27]
    ]
  },
  {
    category: 'Clothing',
    images: [
      'photo-1515372039744-b8f02a3ae446',
      'photo-1485968579580-b6d095142e6e',
      'photo-1434389677669-e08b4cac3105'
    ],
    items: [
      ['Everyday Ribbed Cotton Top', 899, 26],
      ['Relaxed Weekend Joggers', 1299, 18],
      ['Lightweight Cotton Overshirt', 1699, 14]
    ]
  },
  {
    category: 'Shoes',
    images: [
      'photo-1549298916-b41d501d3772',
      'photo-1552346154-21d32810aba3',
      'photo-1600185365483-26d7a4cc7519'
    ],
    items: [
      ['Everyday Court Sneakers', 2199, 17],
      ['Lightweight Training Shoes', 2599, 13],
      ['Comfortable Slide Sandals', 799, 25]
    ]
  },
  {
    category: 'Accessories',
    images: [
      'photo-1548036328-c9fa89d128fa',
      'photo-1553062407-98eeb64c6a62',
      'photo-1553062407-98eeb64c6a62'
    ],
    items: [
      ['Compact Everyday Shoulder Bag', 1699, 15],
      ['Durable Travel Backpack', 1999, 12],
      ['Canvas Zip Pouch Set', 649, 30]
    ]
  },
  {
    category: 'Home',
    images: [
      'photo-1490312278390-ab64016e0aa9',
      'photo-1616486029423-aaa4789e8c9a',
      'photo-1600566753086-00f18fb6b3ea'
    ],
    items: [
      ['Soft Cotton Bedsheet Set', 1899, 16],
      ['Modern Ceramic Table Vase', 899, 20],
      ['Wooden Desk Organizer', 749, 22]
    ]
  },
  {
    category: 'Other',
    images: [
      'photo-1513364776144-60967b0f800f',
      'photo-1455390582262-044cdead277a',
      'photo-1516979187457-637abb4f9353',
      'photo-1513542789411-b6a5d4f31634'
    ],
    items: [
      ['Watercolour Art Starter Set', 1199, 14],
      ['Hardcover Daily Journal', 499, 32],
      ['Reusable Writing Notebook', 799, 18],
      ['Beginner Calligraphy Pen Kit', 699, 21],
      ['Colouring Book and Pencil Set', 599, 24],
      ['Creative Sketch Pad Bundle', 899, 16],
      ['Compact Board Game for Families', 1299, 11],
      ['Reusable Gift Wrap Set', 449, 28]
    ]
  }
];

const additionalProducts = additionalProductGroups.flatMap((group) =>
  group.items.map(([name, price, stock], index) => ({
    name,
    description: `${name} is a practical, thoughtfully chosen ${group.category.toLowerCase()} item for everyday use. Its versatile design makes it easy to enjoy at home, at work, or on the go.`,
    price,
    category: group.category,
    image: `https://images.unsplash.com/${group.images[index % group.images.length]}?w=800&auto=format&fit=crop&q=85`,
    rating: Number((4.1 + ((index + group.items.length) % 9) / 10).toFixed(1)),
    stock
  }))
);

demoProducts.push(...additionalProducts);

const addDemoProducts = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing. Configure it in server/.env before adding demo products.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const existingProductCount = await Product.countDocuments();
    console.log(
      `Connected to ${mongoose.connection.host}/${mongoose.connection.db.databaseName}.${Product.collection.name} (${existingProductCount} existing products).`
    );

    const existingProduct = await Product.findOne().select('owner').lean();
    const seller = existingProduct
      ? null
      : await User.findOne({ role: 'seller' }).select('_id').lean();
    const owner = existingProduct?.owner || seller?._id;

    if (!owner) {
      throw new Error('No product owner or seller account was found. Register a seller account, then run this command again.');
    }

    const existingNames = await Product.distinct('name', {
      name: { $in: demoProducts.map((product) => product.name) }
    });
    const existingNameSet = new Set(existingNames);
    const productsToAdd = demoProducts
      .filter((product) => !existingNameSet.has(product.name))
      .map((product) => ({ ...product, owner }));

    if (productsToAdd.length === 0) {
      console.log('Demo products are already in the catalog; no changes made.');
      return;
    }

    const addedProducts = await Product.insertMany(productsToAdd);
    console.log(`Added ${addedProducts.length} demo products. Existing users and products were left unchanged.`);
  } catch (error) {
    console.error('Could not add demo products:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

addDemoProducts();

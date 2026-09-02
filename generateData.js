const fs = require('fs');

const generateData = () => {
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randElem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

  // 10 Properties
  const properties = [];
  const propertyNames = ["Casa Blanca Tulum", "Villa Mariposa", "Oasis Condesa", "Hacienda San Jose", "Penthouse Polanco", "Vista Del Mar", "Casa Sol", "Brisa de Cabo", "Villa Escondida", "Casa Maya"];
  const locations = ["Tulum, Q.R.", "Playa del Carmen, Q.R.", "Mexico City, CDMX", "San Miguel de Allende, Gto.", "Mexico City, CDMX", "Cancun, Q.R.", "Puerto Vallarta, Jal.", "Cabo San Lucas, B.C.S.", "Oaxaca, Oax.", "Merida, Yuc."];
  for(let i = 0; i < 10; i++) {
    properties.push({
      id: `PROP-${1000 + i}`,
      name: propertyNames[i],
      location: locations[i],
      description: `A stunning luxury property located in ${locations[i]} featuring premium amenities and exclusive design.`,
      price: randInt(15000, 100000), // MXN per night
      bedrooms: randInt(2, 6),
      bathrooms: randInt(2, 6),
      area: randInt(200, 800),
      amenities: ["Pool", "Wi-Fi", "Air Conditioning", "Ocean View", "Chef", "Concierge"].sort(() => 0.5 - Math.random()).slice(0, 4),
      images: [`/properties/p${(i%3)+1}.jpg`],
      status: randElem(["Active", "Maintenance", "Inactive"]),
      availability: randElem(["Available", "Booked"]),
      featured: Math.random() > 0.7
    });
  }

  // 20 Customers
  const customers = [];
  const firstNames = ["Alejandro", "Sofia", "Mateo", "Valentina", "Santiago", "Camila", "Sebastian", "Isabella", "Leonardo", "Victoria", "Emiliano", "Martina", "Diego", "Lucia", "Daniel", "Ximena", "Miguel", "Valeria", "Gael", "Renata"];
  const lastNames = ["Garcia", "Martinez", "Lopez", "Gonzalez", "Perez", "Rodriguez", "Sanchez", "Ramirez", "Cruz", "Flores", "Gomez", "Morales", "Ortiz", "Gutierrez", "Chavez", "Ruiz", "Alvarez", "Fernandez", "Castillo", "Mendoza"];
  for(let i=0; i<20; i++) {
    customers.push({
      id: `CUST-${2000 + i}`,
      name: `${firstNames[i]} ${lastNames[i]}`,
      email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@example.com`,
      phone: `+52 55 ${randInt(1000, 9999)} ${randInt(1000, 9999)}`,
      location: randElem(locations),
      joinDate: randDate(new Date(2025, 0, 1), new Date()).toISOString().split('T')[0],
      status: randElem(["Active", "Active", "Active", "Inactive", "Banned"])
    });
  }

  // 30 Reservations
  const reservations = [];
  for(let i=0; i<30; i++) {
    const prop = randElem(properties);
    const cust = randElem(customers);
    const nights = randInt(2, 14);
    reservations.push({
      id: `RES-${3000 + i}`,
      customerId: cust.id,
      customerName: cust.name,
      propertyId: prop.id,
      propertyName: prop.name,
      checkIn: randDate(new Date(2026, 7, 1), new Date(2026, 11, 31)).toISOString().split('T')[0],
      nights: nights,
      guests: randInt(2, prop.bedrooms * 2),
      amount: prop.price * nights,
      paymentStatus: randElem(["Paid", "Pending", "Failed"]),
      status: randElem(["Confirmed", "Pending", "Cancelled", "Completed"])
    });
  }

  // 15 Products (E-commerce)
  const products = [];
  const prodNames = ["Signature Scent Candle", "Egyptian Cotton Robe", "Artisan Coffee Blend", "Luxury Bath Salts", "Handwoven Throw Blanket", "Premium Tequila Set", "Organic Silk Pillowcase", "Bespoke Room Spray", "Designer Espresso Cups", "Spa Gift Basket", "Handcrafted Mezcal Glasses", "Aromatherapy Diffuser", "Cashmere Slippers", "Curated Art Book", "Welcome Champagne Basket"];
  for(let i=0; i<15; i++) {
    products.push({
      id: `PROD-${4000 + i}`,
      name: prodNames[i],
      sku: `SKU-${prodNames[i].substring(0,3).toUpperCase()}-${100+i}`,
      description: "Exclusive VIICASA curated product for our luxury guests.",
      price: randInt(800, 8000), // MXN
      inventory: randInt(0, 100),
      category: randElem(["Home", "Bath", "Food & Beverage", "Apparel"]),
      images: ["/products/placeholder.jpg"],
      status: randElem(["Active", "Active", "Draft", "Archived"])
    });
  }

  // 25 Orders
  const orders = [];
  for(let i=0; i<25; i++) {
    const cust = randElem(customers);
    const prod = randElem(products);
    const qty = randInt(1, 3);
    orders.push({
      id: `ORD-${5000 + i}`,
      customerId: cust.id,
      customerName: cust.name,
      items: [{ productId: prod.id, productName: prod.name, quantity: qty, price: prod.price }],
      amount: prod.price * qty,
      date: randDate(new Date(2026, 0, 1), new Date()).toISOString().split('T')[0],
      paymentStatus: randElem(["Paid", "Pending"]),
      shippingStatus: randElem(["Processing", "Shipped", "Delivered"])
    });
  }

  // 40 Transactions
  const transactions = [];
  for(let i=0; i<40; i++) {
    const isRes = Math.random() > 0.4;
    const ref = isRes ? randElem(reservations) : randElem(orders);
    transactions.push({
      id: `TRX-${6000 + i}`,
      customerId: ref.customerId,
      customerName: ref.customerName,
      referenceId: ref.id,
      amount: ref.amount,
      provider: randElem(["Stripe", "PayPal", "Bank Transfer", "Shopify Payments"]),
      date: randDate(new Date(2026, 0, 1), new Date()).toISOString(),
      status: randElem(["Paid", "Paid", "Paid", "Pending", "Failed", "Refunded"])
    });
  }

  // 30 Notifications
  const notifications = [];
  for(let i=0; i<30; i++) {
    notifications.push({
      id: `NOT-${7000 + i}`,
      type: randElem(["New reservation", "Payment received", "New customer", "Low inventory", "Failed payment", "Integration warning"]),
      message: "System notification regarding recent activity.",
      date: randDate(new Date(2026, 7, 1), new Date()).toISOString(),
      read: Math.random() > 0.5
    });
  }

  // 20 Messages
  const messages = [];
  for(let i=0; i<20; i++) {
    const cust = randElem(customers);
    messages.push({
      id: `MSG-${8000 + i}`,
      customerId: cust.id,
      customerName: cust.name,
      lastMessage: "I would like to inquire about the amenities at my upcoming stay.",
      date: randDate(new Date(2026, 7, 1), new Date()).toISOString(),
      status: randElem(["Unread", "Read", "Replied", "Closed"]),
      priority: randElem(["High", "Medium", "Low"])
    });
  }

  const exportStr = `export const initialData = ${JSON.stringify({ properties, customers, reservations, products, orders, transactions, notifications, messages }, null, 2)};`;
  fs.writeFileSync('src/lib/mockData.ts', exportStr);
  console.log("Mock data generated in src/lib/mockData.ts");
};

generateData();

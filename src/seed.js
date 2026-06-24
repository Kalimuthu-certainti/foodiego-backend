require('dotenv').config();
const { sequelize, Banner, Cuisine, Restaurant, RestaurantOffer } = require('./models');

const seed = async () => {
  await sequelize.authenticate();

  // Cuisines
  await Cuisine.bulkCreate([
    { name: 'Burgers', slug: 'burgers', iconUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=80', displayOrder: 1 },
    { name: 'Pizza', slug: 'pizza', iconUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=80', displayOrder: 2 },
    { name: 'Chinese', slug: 'chinese', iconUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=80', displayOrder: 3 },
    { name: 'Coffee', slug: 'coffee', iconUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=80', displayOrder: 4 },
    { name: 'Sandwiches', slug: 'sandwiches', iconUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=80', displayOrder: 5 },
    { name: 'Fast Food', slug: 'fast-food', iconUrl: 'https://images.unsplash.com/photo-1619881590738-a111d176d906?w=80', displayOrder: 6 },
  ], { ignoreDuplicates: true });

  // Banners
  await Banner.bulkCreate([
    { title: '50% OFF Your First Order', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', isActive: true, displayOrder: 1 },
    { title: 'Free Coffee with Any Combo', imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800', isActive: true, displayOrder: 2 },
    { title: 'Burger King — 2 for $10 Whoppers', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', isActive: true, displayOrder: 3 },
  ], { ignoreDuplicates: true });

  // Restaurants (ONroute brands at Ontario plaza coords)
  const restaurants = await Restaurant.bulkCreate([
    {
      name: "Tim Hortons — Barrie North",
      slug: "tim-hortons-barrie-north",
      cuisineTags: ["Coffee", "Fast Food", "Sandwiches"],
      rating: 4.6,
      minOrder: 5,
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
      isVeg: false, isActive: true, isClosed: false,
      lat: 44.4001, lng: -79.6678,
    },
    {
      name: "Subway — Barrie North",
      slug: "subway-barrie-north",
      cuisineTags: ["Sandwiches", "Fast Food"],
      rating: 4.3,
      minOrder: 8,
      imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400",
      isVeg: false, isActive: true, isClosed: false,
      lat: 44.4001, lng: -79.6678,
    },
    {
      name: "Burger King — Cookstown",
      slug: "burger-king-cookstown",
      cuisineTags: ["Burgers", "Fast Food"],
      rating: 4.5,
      minOrder: 7,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
      isVeg: false, isActive: true, isClosed: false,
      lat: 44.1833, lng: -79.7167,
    },
    {
      name: "Pizza Pizza — Cookstown",
      slug: "pizza-pizza-cookstown",
      cuisineTags: ["Pizza", "Fast Food"],
      rating: 4.2,
      minOrder: 10,
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
      isVeg: false, isActive: true, isClosed: false,
      lat: 44.1833, lng: -79.7167,
    },
    {
      name: "Starbucks — Milton",
      slug: "starbucks-milton",
      cuisineTags: ["Coffee", "Fast Food"],
      rating: 4.7,
      minOrder: 5,
      imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
      isVeg: true, isActive: true, isClosed: false,
      lat: 43.5151, lng: -79.8838,
    },
    {
      name: "Wendy's — Kingston East",
      slug: "wendys-kingston-east",
      cuisineTags: ["Burgers", "Fast Food"],
      rating: 4.4,
      minOrder: 8,
      imageUrl: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400",
      isVeg: false, isActive: true, isClosed: false,
      lat: 44.2529, lng: -76.4943,
    },
    {
      name: "Panda Express — Guelph",
      slug: "panda-express-guelph",
      cuisineTags: ["Chinese", "Fast Food"],
      rating: 4.5,
      minOrder: 10,
      imageUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400",
      isVeg: false, isActive: true, isClosed: false,
      lat: 43.5501, lng: -80.2498,
    },
    {
      name: "A&W — Guelph",
      slug: "aw-guelph",
      cuisineTags: ["Burgers", "Fast Food"],
      rating: 4.3,
      minOrder: 6,
      imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400",
      isVeg: false, isActive: true, isClosed: false,
      lat: 43.5501, lng: -80.2498,
    },
  ], { ignoreDuplicates: true });

  // Offers for some restaurants
  const now = new Date();
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await RestaurantOffer.bulkCreate([
    { restaurantId: restaurants[0].id, offerText: '20% off on orders above $15', offerCode: 'TIM20', minOrder: 15, maxDiscount: 5, isActive: true, startDate: now, endDate: future },
    { restaurantId: restaurants[2].id, offerText: '2 for $10 Whopper deal', offerCode: 'BK2FOR10', minOrder: 10, maxDiscount: 10, isActive: true, startDate: now, endDate: future },
    { restaurantId: restaurants[4].id, offerText: 'Free pastry with any drink', offerCode: 'SBFREE', minOrder: 7, maxDiscount: 4, isActive: true, startDate: now, endDate: future },
  ]);

  console.log('✅ Seed complete');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });

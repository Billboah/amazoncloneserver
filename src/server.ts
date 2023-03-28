import  express from "express";
import  cors from "cors";
import  bodyParser from 'body-parser';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json())

interface Item {
  title: string
  category: string
  description: string
  id: number
  rating: number
  price: number
  image: string
  count: number
}

app.get('/api/data', (req, res) => {
              res.send('Hello, world!');
            });

app.post('/api/data', async (req, res) => {
  const { newBasket, products, userEmail } = req.body
  const allProducts = {
    items: products, // array of product objects imported from somewhere else
    get: function (id: number) {
      return this.items.find((item: Item) => item.id === id)
    },
  }
  const tranformedItems = newBasket.map((item:Item) => {
    const storeItem = allProducts.get(item.id)
    return {
      quantity: item.count,
      price_data: {
        currency: 'usd',
        unit_amount: storeItem.price * 100,
        product_data: {
          description: storeItem.description,
          name: storeItem.title,
          images: [storeItem.image],
        },
      },
    }
  })

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 500, currency: 'usd' },
          display_name: 'Next day shipping',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 3 },
            maximum: { unit: 'business_day', value: 7 },
          },
        },
      },
    ],
    shipping_address_collection: {
      allowed_countries: ['BG', 'US', 'CA'],
    },
    line_items: tranformedItems,
    mode: 'payment',
    success_url: `https://billamazonclone.vercel.app/success`,
    cancel_url: `https://billamazonclone.vercel.app/checkout`,
    metadata: {
      userEmail,
      images: JSON.stringify(newBasket.map((item:Item) => item.image)),
      quantity: JSON.stringify(newBasket.map((item:Item) => item.count)),
    },
  })
  const data = session

  res.json({ data })
})

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;

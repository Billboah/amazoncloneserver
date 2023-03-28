"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: 'https://billamazonclone.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
app.get('/api/data', (req, res) => {
    res.send('Hello, world!');
});
app.post('/api/data', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { newBasket, products, userEmail } = req.body;
    const allProducts = {
        items: products,
        get: function (id) {
            return this.items.find((item) => item.id === id);
        },
    };
    const tranformedItems = newBasket.map((item) => {
        const storeItem = allProducts.get(item.id);
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
        };
    });
    const session = yield stripe.checkout.sessions.create({
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
            images: JSON.stringify(newBasket.map((item) => item.image)),
            quantity: JSON.stringify(newBasket.map((item) => item.count)),
        },
    });
    const data = session;
    res.json({ data });
}));
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

# E-Commerce Full-Stack Application

A complete, modern full-stack e-commerce website built with React, Node.js, Express, and MongoDB. This project is designed as a beginner-to-intermediate web development project with clean, modular code.

## Features

### User Features
- **Product Browsing**: View all products with search, filter by category, and sort by price
- **Product Details**: Detailed view of each product with images, descriptions, ratings, and stock information
- **Shopping Cart**: Add products to cart, adjust quantities, remove items, and view subtotal/total
- **User Authentication**: Register and login with JWT-based authentication
- **Checkout**: Complete checkout process with shipping address and payment method selection
- **Order Management**: View order history with order status tracking
- **Responsive Design**: Fully responsive UI that works on desktop, tablet, and mobile devices

### Admin Features
- **Dashboard**: Overview of total products, orders, users, and revenue
- **Product Management**: Add, edit, and delete products
- **Order Management**: View all orders and update order status
- **User Management**: View all registered users
- **Authentication**: Admin-only access to dashboard and management features

## Tech Stack

### Frontend
- **React.js** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - CSS framework for styling
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API requests
- **React Context API** - State management for authentication and cart

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT (JSON Web Tokens)** - Authentication
- **bcryptjs** - Password hashing
- **dotenv** - Environment variable management
- **cors** - Cross-Origin Resource Sharing

## Project Structure

```
ecommerce/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── components/              # Reusable React components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── ProductCard.jsx
│   │   ├── pages/                   # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── ProductDetails.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── MyOrders.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── context/                # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
│   │   ├── services/               # API service
│   │   │   └── api.js
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── App.jsx                 # Main App component
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env
│
├── server/                          # Backend Express application
│   ├── controllers/                # Route controllers
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   └── userController.js
│   ├── models/                     # MongoDB models
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   ├── routes/                     # API routes
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   └── userRoutes.js
│   ├── middleware/                 # Custom middleware
│   │   └── auth.js
│   ├── config/                     # Configuration files
│   │   └── db.js
│   ├── seed/                       # Database seed script
│   │   └── seed.js
│   ├── server.js                   # Server entry point
│   ├── package.json
│   └── .env
│
├── .env.example                    # Example environment variables
└── README.md                       # This file
```

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)
- **npm** (comes with Node.js)

## Installation Steps

### 1. Clone or Setup the Project

If you have the project files, navigate to the project directory:

```bash
cd ecommerce
```

### 2. Install MongoDB

#### Windows:
1. Download MongoDB from the official website
2. Run the installer and follow the setup wizard
3. Start MongoDB service (it usually starts automatically)
4. Verify MongoDB is running by checking if it's listening on port 27017

#### Mac:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux:
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### 3. Setup Environment Variables

Copy the example environment file and configure it:

```bash
# Configure the backend
cd server
copy .env.example .env
```

Edit `server/.env` and configure the following:

```env
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=<random secret of at least 32 characters>
OTP_SECRET=<different random secret of at least 32 characters>
# Set to false to temporarily skip phone OTP on registration and login.
OTP_VERIFICATION_ENABLED=false
PORT=5000

TWILIO_ACCOUNT_SID=<your Twilio account SID>
TWILIO_AUTH_TOKEN=<your Twilio auth token>
TWILIO_FROM_NUMBER=<your Twilio phone number in E.164 format>

# Local development only; the phone verification code appears in the server terminal.
VERIFICATION_DELIVERY_MODE=console
```

To use MongoDB Atlas instead of a local MongoDB server, replace `MONGODB_URI` with your Atlas connection string. In Atlas, create a database user and allow your development machine's IP address in Network Access. Use the database user's username and a newly rotated password in the URI; URL-encode any special characters in the password. For example:

```env
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@cluster0.kcp6lkp.mongodb.net/ecommerce?retryWrites=true&w=majority
```

Keep the completed URI only in `server/.env`; do not commit it or put it in the frontend. The backend waits for MongoDB to connect before it starts listening, and exits with an error if the URI is missing or the connection fails.

Generate each secret locally; never commit real credentials:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

With `OTP_VERIFICATION_ENABLED=false`, registration and login temporarily skip phone OTP; newly registered accounts are signed in immediately. Seller registrations still require admin approval before managing product listings, but admins do not need to wait for phone OTP while it is disabled. Set `OTP_VERIFICATION_ENABLED=true` (or remove the setting, which defaults to enabled) to restore OTP verification. After changing `server/.env`, restart the backend. When OTP is enabled, `VERIFICATION_DELIVERY_MODE=console` prints codes in the backend terminal for local development; never use console delivery in production. Codes expire after 10 minutes, allow five attempts, and can be resent once per minute (up to five resends per session); verification endpoints are rate-limited by IP.

For a Twilio trial account, the destination phone must be verified in Twilio before SMS can be delivered. When OTP is enabled, legacy accounts created before phone verification remain able to log in, while new registrations must verify their phone number.

### 4. Install Backend Dependencies

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

### 5. Install Frontend Dependencies

Navigate to the client directory and install dependencies:

```bash
cd ../client
npm install
```

### 6. Seed the Database

Run the seed script to populate the database with sample products and create an admin user:

```bash
cd ../server
npm run seed
```

This will:
- Create 10 sample products across different categories
- Create an admin user with the following credentials:
  - Email: `admin@ecommerce.com`
  - Password: `admin123`

To add the sample products to an existing database without deleting users or products, run this from the `server` directory instead:

```bash
npm run seed:products
```

This adds any missing demo products and can be run again safely. It uses an existing product owner or seller account.

## Running the Application

### Start the Backend Server

In the `server` directory:

```bash
cd server
npm run dev
```

The backend server will start on `http://localhost:5000`

### Start the Frontend Development Server

In a new terminal, navigate to the `client` directory:

```bash
cd client
npm run dev
```

The frontend will start on `http://localhost:3000`

### Access the Application

Open your browser and navigate to: `http://localhost:3000`

## API Documentation

### Base URL
`http://localhost:5000/api`

### Authentication Endpoints

#### Register User
- **POST** `/auth/register`
- **Body**: `{ name, email, password }`
- **Response**: `{ success, message, token, user }`

#### Login User
- **POST** `/auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ success, message, token, user }`

#### Get Current User
- **GET** `/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success, user }`

### Product Endpoints

#### Get All Products
- **GET** `/products`
- **Query Params**: `search`, `category`, `sort`
- **Response**: `{ success, count, products }`

#### Get Single Product
- **GET** `/products/:id`
- **Response**: `{ success, product }`

#### Create Product (Admin Only)
- **POST** `/products`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Product object
- **Response**: `{ success, message, product }`

#### Update Product (Admin Only)
- **PUT** `/products/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Product object
- **Response**: `{ success, message, product }`

#### Delete Product (Admin Only)
- **DELETE** `/products/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success, message }`

### Order Endpoints

#### Create Order
- **POST** `/orders`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ products, shippingAddress, paymentMethod }`
- **Response**: `{ success, message, order }`

#### Get My Orders
- **GET** `/orders/my-orders`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success, count, orders }`

#### Get All Orders (Admin Only)
- **GET** `/orders`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success, count, orders }`

#### Get Single Order
- **GET** `/orders/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success, order }`

#### Update Order Status (Admin Only)
- **PUT** `/orders/:id/status`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ orderStatus }`
- **Response**: `{ success, message, order }`

### User Endpoints

#### Get All Users (Admin Only)
- **GET** `/users`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success, count, users }`

#### Get Single User (Admin Only)
- **GET** `/users/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success, user }`

## Admin Login Instructions

1. Navigate to the application at `http://localhost:3000`
2. Click on the "Login" button in the navbar
3. Enter the admin credentials:
   - **Email**: `admin@ecommerce.com`
   - **Password**: `admin123`
4. Click "Login"
5. You will see an "Admin" link in the navbar
6. Click on "Admin" to access the admin dashboard

### Admin Dashboard Features
- **Dashboard Tab**: View statistics (total products, orders, users, revenue)
- **Products Tab**: Add, edit, and delete products
- **Orders Tab**: View all orders and update their status

## Default Admin Credentials

- **Email**: admin@ecommerce.com
- **Password**: admin123

**Security Note**: Change the admin password immediately after first login in a production environment.

## Sample Products

The seed script creates 10 sample products across these categories:
- Electronics (2 products)
- Clothing (2 products)
- Shoes (2 products)
- Accessories (2 products)
- Home (2 products)

All products include placeholder images from Unsplash.

## Error Handling

The application includes comprehensive error handling for:
- API errors with user-friendly messages
- Form validation on all forms
- Invalid login credentials
- Product not found errors
- Unauthorized access attempts
- Out of stock handling
- Empty cart warnings
- Network errors

## Security Features

- Password hashing with bcryptjs
- JWT-based authentication
- Protected routes for authenticated users
- Role-based authorization (admin vs user)
- CORS enabled for cross-origin requests
- Environment variables for sensitive data
- Password field excluded from user queries by default

## Future Improvements

Potential enhancements for this project:

1. **Payment Integration**: Integrate payment gateways like Stripe or PayPal
2. **Image Upload**: Implement file upload for product images using Multer or Cloudinary
3. **Product Reviews**: Add product review and rating system
4. **Wishlist**: Add wishlist functionality for users
5. **Email Notifications**: Send order confirmation emails
6. **Advanced Search**: Implement more sophisticated search with filters
7. **Product Variants**: Support for product variants (size, color, etc.)
8. **Discount/Coupons**: Add discount code functionality
9. **User Profile**: Allow users to update their profile information
10. **Order Tracking**: Add real-time order tracking
11. **Analytics Dashboard**: Enhanced admin analytics with charts
12. **Dark Mode**: Add dark mode support
13. **Multi-language Support**: Add internationalization
14. **Social Login**: Add Google/Facebook login options
15. **Performance Optimization**: Implement caching, lazy loading, and code splitting

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: Check if MongoDB service is active
- Verify the connection string in `server/.env`
- Check if MongoDB is listening on port 27017

### Port Already in Use
- If port 5000 is in use, change the PORT in `server/.env`
- If port 3000 is in use, change the port in `client/vite.config.js`

### CORS Errors
- Ensure the backend CORS configuration allows requests from the frontend
- Check that the frontend proxy is correctly configured in `vite.config.js`

### Authentication Issues
- Clear browser localStorage and cookies
- Verify JWT_SECRET is set correctly in `server/.env`
- Check that the token is being sent in the Authorization header

### Tailwind CSS Not Working
- Ensure all Tailwind dependencies are installed
- Check that `tailwind.config.js` is correctly configured
- Verify that `index.css` includes the Tailwind directives

## Development Tips

1. **Use nodemon** for backend development (auto-restart on file changes)
2. **Use React DevTools** browser extension for debugging React components
3. **Use MongoDB Compass** for visual database management
4. **Check browser console** for frontend errors
5. **Check server terminal** for backend errors
6. **Use Git** for version control

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please refer to the code comments or create an issue in the project repository.

---

**Happy Coding! 🚀**

# 🛒 Flipkart Product Scraper

A full-stack web application that scrapes product data from Flipkart and presents it through a modern, responsive web interface. Built with Python FastAPI backend and Next.js React frontend.

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.x-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Frontend Features](#-frontend-features)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🕷️ Web Scraping
- **Automated Flipkart scraping** with pagination support
- **Real-time product data extraction** (title, price, rating, specifications)
- **Intelligent retry mechanisms** for robust data collection
- **Duplicate detection** to prevent data redundancy
- **Session management** with cookie handling

### 🗄️ Backend API
- **RESTful API** built with FastAPI
- **MySQL database integration** with SQLAlchemy ORM
- **Advanced search functionality** with fuzzy matching
- **Multiple filtering options** (price, rating, category, brand)
- **Statistical analytics** and trending algorithms
- **Comprehensive error handling** and logging

### 🎨 Frontend Interface
- **Modern React 18+ UI** with Next.js 15
- **Responsive design** with Tailwind CSS
- **Advanced product browsing** with filters and search
- **Interactive image galleries** with navigation
- **Shopping cart functionality** with local storage
- **Real-time data caching** for optimal performance

## 🛠️ Tech Stack

### Backend
- **Python 3.8+** - Core language
- **FastAPI** - Modern web framework
- **SQLAlchemy** - Database ORM
- **MySQL** - Primary database
- **BeautifulSoup4** - HTML parsing
- **curl-cffi** - HTTP requests with CF bypass
- **Pydantic** - Data validation

### Frontend
- **Next.js 15** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **Radix UI** - Component primitives
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Git** - Version control

## 📁 Project Structure

```
Flipkart/
├── backend/                    # Python FastAPI backend
│   ├── alchemy/               # Database models and connections
│   │   ├── create_tables.py   # Database schema setup
│   │   ├── database.py        # Database connection and queries
│   │   ├── models.py          # SQLAlchemy models
│   │   └── schemas.py         # Pydantic schemas
│   ├── api/                   # FastAPI application
│   │   ├── main.py           # Application entry point
│   │   ├── routers/          # API route handlers
│   │   └── *.json           # API response examples
│   ├── modules/              # Scraping modules
│   │   └── flipkart/        # Flipkart-specific scraper
│   ├── settings/            # Configuration files
│   ├── utils/              # Utility functions
│   └── requirements.txt    # Python dependencies
│
├── frontend/                 # Next.js React frontend
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   ├── api/             # API integration layer
│   │   ├── components/      # React components
│   │   │   ├── ui/         # Reusable UI components
│   │   │   └── Storefront.tsx # Main product interface
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/           # Utility functions
│   ├── public/            # Static assets
│   ├── package.json       # Node.js dependencies
│   └── tailwind.config.js # Styling configuration
│
├── .gitignore            # Git ignore rules
└── README.md           # Project documentation
```

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** - [Download Python](https://python.org/downloads/)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **MySQL 8.0+** - [Download MySQL](https://dev.mysql.com/downloads/)
- **Git** - [Download Git](https://git-scm.com/downloads/)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/zaidkx7/flipkart-scraper.git
cd Flipkart
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
# or
yarn install
```

### 4. Database Setup

```sql
-- Create MySQL database
CREATE DATABASE flipkart;

-- Create user (optional)
CREATE USER 'flipkart_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON flipkart_products.* TO 'flipkart_user'@'localhost';
FLUSH PRIVILEGES;
```

## ⚙️ Configuration

### Backend Configuration

Create `backend/.env`:

```bash
# Database configuration
MYSQL_HOST='localhost'
MYSQL_PORT=3306
MYSQL_USER='root'
MYSQL_PASSWORD=''
MYSQL_DB='flipkart'
```

### Frontend Configuration

Create `frontend/.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Development Settings
NODE_ENV=development
```

## 🎯 Usage

### Start the Backend Server

```bash
cd backend
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# or

cd backend\api
python main.py
```

The API will be available at: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

### Start the Frontend Server

```bash
cd frontend
npm run dev
```

The web interface will be available at: `http://localhost:3000`

### Run the Scraper

```bash
cd backend
python modules/flipkart/main.py
```

## 📚 API Documentation

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products/` | Get all products |
| `GET` | `/api/products/{id}` | Get specific product |
| `GET` | `/api/products/search?q={query}` | Search products |
| `GET` | `/api/products/category/{category}` | Filter by category |
| `GET` | `/api/products/brand/{brand}` | Filter by brand |

### Advanced Filtering

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products/filter/price?min_price={min}&max_price={max}` | Price range filter |
| `GET` | `/api/products/filter/rating?min_rating={rating}` | Minimum rating filter |
| `GET` | `/api/products/filter/availability?status={status}` | Availability filter |
| `GET` | `/api/products/trending?limit={limit}` | Trending products |
| `GET` | `/api/products/discounted` | Products with discounts |
| `GET` | `/api/products/stats` | Product statistics |

### Example Response

```json
{
  "id": 1,
  "product_id": "MOBH7443MMBCWPPG",
  "title": "POCO C75 5G (Aqua Bliss, 64 GB)",
  "url": "https://www.flipkart.com/poco-c75-5g-aqua-bliss-64-gb/p/...",
  "rating": {
    "average": 4.3,
    "count": 93979,
    "reviewCount": 4443
  },
  "pricing": {
    "prices": [
      {"strikeOff": true, "value": 10999},
      {"strikeOff": false, "value": 7699}
    ],
    "totalDiscount": 30
  },
  "specifications": [
    "4 GB RAM | 64 GB ROM | Expandable Upto 1 TB",
    "17.48 cm (6.88 inch) HD+ Display",
    "50MP Rear Camera | 5MP Front Camera"
  ],
  "category": "mobile",
  "availability": "IN_STOCK",
  "source": "flipkart"
}
```

## 🎨 Frontend Features

### 🔍 Advanced Search & Filtering
- **Real-time search** with debouncing
- **Multi-criteria filtering** (brand, price, rating, specs)
- **Dynamic price range sliders** with Indian currency formatting
- **Category-based browsing**

### 🖼️ Interactive Product Gallery
- **Scrollable image carousel** with left/right navigation
- **Thumbnail gallery** for quick image selection
- **Keyboard navigation** support (arrow keys)
- **Image zoom and full-screen view**

### 🛒 Shopping Cart
- **Add/remove products** with quantity management
- **Persistent cart** using localStorage
- **Price calculations** with tax and shipping
- **Checkout flow** with form validation

### 📱 Responsive Design
- **Mobile-first approach** with Tailwind CSS
- **Adaptive layouts** for all screen sizes
- **Touch-friendly interactions**
- **Fast loading** with optimized images

### ⚡ Performance Features
- **Intelligent caching** with 5-minute TTL
- **Client-side data persistence**
- **Optimized API calls** with fallback mechanisms
- **Loading states** and error boundaries

## 🔧 Development

### Backend Development

```bash
# Install development dependencies
pip install pytest black flake8 mypy

# Run tests
pytest

# Format code
black .

# Lint code
flake8 .

# Type checking
mypy .
```

### Frontend Development

```bash
# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

### Database Management

```bash
# Create database tables
cd backend
python alchemy/create_tables.py

# Reset database (caution!)
python -c "from alchemy.database import MysqlConnection; MysqlConnection().reset_database()"
```

## 🚀 Deployment

### Backend Deployment

1. **Production Environment Setup**
   ```bash
   pip install gunicorn
   gunicorn api.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

2. **Environment Variables**
   ```bash
   export DB_URL="mysql+pymysql://user:pass@host/db"
   export DEBUG_MODE=False
   ```

### Frontend Deployment

1. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style and formatting
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## ⚠️ Disclaimer

This project is for educational purposes only. Please ensure you comply with:
- **Flipkart's Terms of Service**
- **Robots.txt guidelines**
- **Rate limiting best practices**
- **Local laws and regulations**

Always respect website policies and implement appropriate delays between requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/zaidkx7/flipkart-scraper/issues) page
2. Create a new issue with detailed information
3. Join our discussions in the repository

## 🙏 Acknowledgments

- **FastAPI** for the excellent Python web framework
- **Next.js** for the powerful React framework
- **Tailwind CSS** for the utility-first CSS framework
- **Radix UI** for accessible component primitives
- **Flipkart** for providing the data source

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by [Muhammad Zaid](https://zaidkx7.github.io/)

</div>

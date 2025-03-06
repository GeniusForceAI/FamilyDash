# Baker Family Finances

A modern web application for managing the Baker family's income and bills, featuring a cyberpunk theme and real-time updates.

## Architecture

The application uses a two-server architecture for better security and scalability:

### API Server (Port 8000)
- FastAPI server handling data operations
- RESTful endpoints at `/api/finances`
- CORS configured for frontend access
- JSON-based data storage
- Pydantic models for validation

### Frontend Server (Port 3000)
- Static file server
- Single-page application (SPA)
- Cyberpunk-themed UI
- Dark/light mode support
- Real-time financial calculations

## Setup

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install fastapi uvicorn
```

3. Start the API server:
```bash
uvicorn server:app --reload --port 8000
```

4. In a new terminal, start the frontend server:
```bash
python frontend_server.py
```

5. Access the application:
- Frontend: http://localhost:3000
- API Documentation: http://localhost:8000/docs

## Features

- View and edit biweekly income
- Automatic monthly income calculation
- Manage bills with categories
- Real-time total calculations
- Modern, responsive UI
- Dark/light mode toggle
- Animated UI elements

## Development

The project uses:
- FastAPI for the backend
- Vanilla JavaScript for frontend
- CSS Grid and Flexbox for layout
- CSS Variables for theming
- Fetch API for data communication

## API Endpoints

### GET /api/finances
Retrieve current financial data including income and bills.

### POST /api/finances
Update financial data with new income or bill information.

## Data Structure

```json
{
  "income": {
    "biweekly": float,
    "monthly": float
  },
  "bills": [
    {
      "name": string,
      "amount": float,
      "category": string
    }
  ]
}
```

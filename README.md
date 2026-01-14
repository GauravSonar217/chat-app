# 🚀 Real-Time Chat Application (MERN Stack)

A full-stack real-time chat application built using the **MERN stack** with modern development practices.  
This project is designed to simulate **real-world chat systems**, focusing on scalability, clean architecture, authentication, and real-time communication.

> 🔥 Built to strengthen backend confidence and demonstrate production-level full stack skills.

---

## ✨ Features

### 👤 User Features
- User registration & login (JWT-based authentication)
- Secure password hashing
- One-to-one real-time chat
- Group chat support
- Online / offline user status
- Message read receipts *(planned)*
- Media sharing *(planned)*

### 🛠️ Admin / System Features
- User management
- Chat moderation *(planned)*
- Message & activity logs *(planned)*
- Scalable backend architecture

---

## 🧠 Why this project?

This project was built with the intention to:
- Gain **hands-on backend experience**
- Work with **real-time systems (Socket.io)**
- Design APIs from scratch
- Handle authentication, authorization, and data flow
- Build something usable by **real users**, not just a demo

It closely reflects **real-world product development** rather than tutorial-based projects.

---

## 🧱 Tech Stack

### Frontend
- React.js (Vite)
- Tailwind CSS
- Axios
- Socket.io Client

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Socket.io
- bcrypt

### Tools & Practices
- RESTful API design
- MVC architecture
- Environment-based configuration
- Git & GitHub (monorepo)
- Modular & scalable folder structure

---

## 📁 Project Structure

```txt
chat-app/
│
├── frontend/        # React client
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/         # Node.js server
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── utils/
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🌐 API Overview (Backend)

### Authentication

- POST /api/auth/register → Register new user
- POST /api/auth/login → Authenticate user & return JWT

### Chats

- POST /api/chats → Create or access a chat
- GET /api/chats → Fetch user chats

### Messages

- POST /api/messages → Send a message
- GET /api/messages/:chatId → Fetch chat messages

## ▶️ How to Run Locally

### 1️⃣ Clone the repository

- git clone https://github.com/your-username/chat-app.git
- cd chat-app

### 2️⃣ Run Backend

- cd backend
- npm install
- npm run dev

### 3️⃣ Run Frontend

- cd frontend
- npm install
- npm run dev

## 🚀 Deployment Plan

- Frontend → Netlify
- Backend → Render / Railway
- Database → MongoDB Atlas

## 👨‍💻 Author

```md
**Gaurav Sonar**
MERN Stack Developer

```bash
GitHub: https://github.com/your-username
LinkedIn: https://linkedin.com/in/your-profile
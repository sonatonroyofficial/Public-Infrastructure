# 🏛️ Public Infrastructure Issue Reporting System

A comprehensive full-stack web application that empowers citizens to report public infrastructure issues—such as broken streetlights, potholes, and water leakage—while enabling government staff to efficiently manage and resolve them.

---

## 📋 Information

- **Website Name**: InfraReport
- **Admin Email**: `sonaton.fl@gmail.com`
- **Admin Password**: `sonaton123`
- **Live Site URL**: [https://public-infrastrure-system.web.app/](http://localhost:5173) *(Currently running locally)*
- **Backend API**: [https://public-infrastructure-issue-reporti-silk.vercel.app](https://public-infrastructure-issue-reporti-silk.vercel.app)

---

## ✨ Key Features

1.  **Secure Authentication**: Robust JWT-based authentication with secure password hashing (bcryptjs) and automatic session management.
2.  **Role-Based Access Control (RBAC)**: Distinct interfaces and permissions for three user roles: **Citizen**, **Staff**, and **Admin**.
3.  **Interactive Dashboard**: Dynamic, real-time dashboards for all user types featuring statistics, charts (Recharts), and status overviews.
4.  **Issue Reporting System**: User-friendly reporting interface allowing citizens to submit issues with detailed descriptions, categories, and location data.
5.  **Smart Workflow Management**: Structured workflow (Pending → Assigned → In Progress → Resolved) for Staff to efficiently track and update tasks.
6.  **Admin Control Panel**: Comprehensive suite of tools for Admins to manage users, assign issues to staff, and oversee the entire system.
7.  **Payment & Invoicing**: Integrated payment simulation that allows users to upgrade to Premium, including automatic PDF invoice generation.
8.  **Responsive Design**: A fully responsive, mobile-first UI built with **Tailwind CSS**, ensuring a seamless experience across all devices.
9.  **Modern Animations**: Polished user experience with smooth element transitions and entrance animations powered by **Framer Motion**.
10. **Advanced Search & Filtering**: Powerful server-side search and filtering capabilities to quickly locate specific issues by status, category, or keyword.
11. **Contact & Communication**: integrated contact form handling where user inquiries are instantly stored in the backend for admin review.
12. **Profile Management**: Complete user profile system allowing users to update their personal details and manage their account settings.

---

## 🛠️ Tech Stack

### Frontend
-   **React 19**: Modern UI library for building interactive interfaces.
-   **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
-   **Framer Motion**: Production-ready animation library.
-   **Recharts**: Composable charting library for React.
-   **React Router**: Standard routing library for React applications.
-   **Axios**: Promise-based HTTP client for the browser.

### Backend
-   **Node.js & Express**: Fast, unopinionated web framework for Node.js.
-   **MongoDB**: Flexible NoSQL database for modern applications.
-   **JWT (JSON Web Tokens)**: Securely transmitting information between parties.
-   **Firebase Admin SDK**: For advanced administrative capabilities.

---

## 🚀 Getting Started

### Prerequisites
-   Node.js (v16+)
-   MongoDB (Local or Atlas)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    ```

2.  **Backend Setup**
    ```bash
    cd "Public Infrastructure Issue Reporting System-Server-side"
    npm install
    # Create a .env file with:
    # MONGODB_URI=mongodb://localhost:27017/infrastructure_reporting
    # PORT=5000
    # JWT_SECRET=your_jwt_secret
    npm run dev
    ```

3.  **Frontend Setup**
    ```bash
    cd "public-infrastrure-issue-reporting-system-client-side"
    npm install
    npm run dev
    ```

4.  **Access the Application**
    -   Frontend: `https://public-infrastrure-system.web.app/`
    -   Backend: `https://public-infrastructure-issue-reporti-silk.vercel.app`

---

## 🧪 Demo Credentials

The application automatically seeds these users upon first database connection:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `sonaton.fl@gmail.com` | `sonaton123` |
| **Staff** | `staff@gmail.com` | `staff123` |
| **Citizen** | `citizen@gmail.com` | `citizen123` |

---

## 📄 License
This project is open-source and available for educational purposes.

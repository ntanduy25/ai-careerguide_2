import { GoogleOAuthProvider } from "@react-oauth/google"
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { AssessmentProvider } from "./context/AssessmentContext"
import { AuthProvider } from "./context/AuthContext"
import "./index.css"

const app = (
  <AuthProvider>
    <AssessmentProvider>
      <App />
    </AssessmentProvider>
  </AuthProvider>
)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        {app}
      </GoogleOAuthProvider>
    ) : (
      app
    )}
  </React.StrictMode>,
)

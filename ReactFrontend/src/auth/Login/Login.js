import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, getCustoken } from "../../services/Api";
import { storeUserData } from '../../services/Storage.js';
import "./Login.css";

function Login(){
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();  // Prevents Page Reload: By default, HTML forms trigger a full-page reload when submitted,
    // this stops that so the form can be handled using React which handles the login logic inside handleSubmit.
    setLoading(true); // Show spinner
    loginUser(loginData.email, loginData.password).then(async (response)=>{
            storeUserData(response.data.idToken)
            alert("Login successful");
            await getCustoken();
            navigate("/dashboard"); // Redirect to login page
        }).catch((error)=>{
            const errorMsg = error.response.data.error.message;
            let customErr = "";
            if(errorMsg === "INVALID_LOGIN_CREDENTIALS"){
              customErr = "Invalid Credentials";
            }else{
              customErr = "Something went wrong";
            }
            setError(customErr);
        }).finally(()=>{
            setLoading(false);
        })
  };

  return (
    <div className="auth-container">
      <div className="card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Id</label>
            <input type="text" id="email" name="email" value={loginData.email} onChange={handleChange} placeholder="Enter your email id" required/>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" id="password" name="password" value={loginData.password} onChange={handleChange} placeholder="Enter your password" required/>
          </div>
          {error && <p className="error">{String(error)}</p>}
          {loading ? <button disabled={true}><span className="spinner"></span></button> : <button type="submit">Login</button>}
        </form>
        <p>
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;

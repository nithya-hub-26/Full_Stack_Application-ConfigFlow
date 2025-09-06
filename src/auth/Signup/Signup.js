import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from "../../services/Api.js";
import { storeUserData } from '../../services/Storage.js';
import "./Signup.css"

function Signup(){
  const [signupData, setSignupData] = useState({ displayName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupData({ ...signupData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();  // Prevents Page Reload: By default, HTML forms trigger a full-page reload when submitted,
    // this stops that so the form can be handled using React which handles the login logic inside handleSubmit.
    setLoading(true); // Show spinner
    registerUser(signupData.displayName, signupData.email, signupData.password).then((response)=>{
            storeUserData(response.data.idToken)
            alert("Registration successful");
            navigate("/login"); // Redirect to login page
        }).catch((error)=>{
            const errorMsg = error.response.data.error.message;
            let customErr = "";
            if(errorMsg === "EMAIL_EXISTS"){
              customErr = "Already this email has been registered!";
            }else if(String(errorMsg).includes('WEAK_PASSWORD')){
              customErr = "Password should be at least 6 characters";
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
        <h2>Sign up</h2>
        <form onSubmit={handleSubmit}>
        <div className="form-group">
            <label>Name</label>
            <input type="text" id="displayName" name="displayName" value={signupData.displayName} onChange={handleChange} placeholder="Enter your name" required/>
          </div>
          <div className="form-group">
            <label>Email Id</label>
            <input type="text" id="email" name="email" value={signupData.email} onChange={handleChange} placeholder="Enter your email id" required/>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" id="password" name="password" value={signupData.password} onChange={handleChange} placeholder="Enter your password" required/>
          </div>
          {error && <p className="error">{String(error)}</p>}
          {loading ? <button disabled={true}><span className="spinner"></span></button> : <button type="submit">Create Account</button>}
        </form>
        <p>
          Already have an account?<a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;

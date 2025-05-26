// Pages/AuthN.js
import React from 'react';
import LoginControl from '../CommonComponents/UserAuth/Login';

function AuthNPage () {
  const loginCaption = "User Login";
  const isAuthorized = false; // This would typically come from your auth logic

  return (
    <div>
      <LoginControl caption={loginCaption} isAuthorized={isAuthorized} />
      {/* Other components */}
    </div>
  );
};

export default AuthNPage;
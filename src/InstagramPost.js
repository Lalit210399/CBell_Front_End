import React, { useState } from 'react';
import InstagramMediaUploader from './CommonComponents/SocialMediaPost/Instagram';

const InstagramPost = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Post to Instagram</button>

      <InstagramMediaUploader
        igUserId="17841474808473956"
        fbPageId="648945998310294"
        accessToken="EAAJ0QEHHOUIBO6rEEMGPCxkkfju3Rm9VCss9qFG3ZBCC7nZCKKbcMY5a5ywKlPMfJq9ZCL9zAmtK6QxDuw6Ut98Oz6PT6pGoJ5krT3ZBPHIZBm7USB3DQZCAkysUY3fZAIb5kVYrLUtGKZBZANetU5zKln0sRe1UzKpXch6tcn5ZCEZCHBAgzZBmZApO066DybYamKWIGRGHMckcOO6awjxI8m3OiNbDnvQAZD"
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export default InstagramPost;

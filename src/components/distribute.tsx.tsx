import { notification, Typography } from 'antd';
import { useState } from 'react';

export const ClaimHelpers = () => {
  const [visible, setVisible] = useState(false);

  const [fetchedCode, setFetchedCode] = useState('');

  const fetchCode = async () => {
    await fetch('/api/checkCriteria')
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setFetchedCode(data.code);
      });

    notification.success({
      message: 'Code Fetched',
      description: 'Code has been fetched successfully. See the /api/checkCriteria.ts file for more details.'
    });
  };

  return (
    <>
      <br />
      <div className="flex-center">
        <button
          className="landing-button"
          onClick={() => {
            if (!visible) fetchCode();
            setVisible(!visible);
          }}
          style={{ width: 200 }}
        >
          {visible ? 'Hide' : 'Check Criteria'}
        </button>
      </div>
      <br />
      {visible && (
        <>
          <div className="text-center">
            Code:{' '}
            <Typography.Text className="primary-text" copyable>
              {fetchedCode}
            </Typography.Text>
          </div>
          <div className="text-center">
            <a
              href={`https://bitbadges.io/collections/ADD_COLLECTION_ID_HERE?claimId=CLAIM_ID&code=${fetchedCode}`} //You can also do this with a password=abc123 for the password plugin
              target="_blank"
              rel="noreferrer"
            >
              Claim Link
            </a>
          </div>
          <div className="text-center">
            <a href={`https://bitbadges.io/saveforlater?value=${fetchedCode}`} target="_blank" rel="noreferrer">
              Save for Later Link
            </a>
          </div>
        </>
      )}
    </>
  );
};

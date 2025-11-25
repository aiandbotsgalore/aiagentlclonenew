import React, { useEffect, useRef } from 'react';
import { useLiveAPI } from '../context/LiveAPIProvider';
import { useUserStore } from '../stores/useUser';
import BasicFace from './BasicFace';

const KeynoteCompanion: React.FC = () => {
    const { isConnected, client, outputVolume } = useLiveAPI();
    const { name } = useUserStore();
    const greetingSent = useRef(false);

    useEffect(() => {
        // Only send the initial greeting once when a new connection is established.
        if (isConnected && client && !greetingSent.current) {
            client.sendInitialText(`Greet the user named ${name} and ask how you can help them today.`);
            greetingSent.current = true;
        }

        // Reset the flag when disconnected to allow greeting on next connection.
        if (!isConnected) {
            greetingSent.current = false;
        }
    }, [isConnected, client, name]);

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-[400px] h-[400px]">
                <BasicFace volume={outputVolume} />
            </div>
        </div>
    );
};

export default KeynoteCompanion;
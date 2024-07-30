import React from "react";

const TextWithLineBreaks = ({ text }) => {
    const parts = text.split('\n');
    return (
        <>
            {parts.map((part, index) => (
                <p key={index}>
                    {part}
                    {index < parts.length - 1}
                </p>
            ))}
        </>
    );
};
export default TextWithLineBreaks;

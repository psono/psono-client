import React from "react";

export interface TextWithLineBreaksProps {
	text: string;
}

const TextWithLineBreaks = ({ text }: TextWithLineBreaksProps) => {
	const parts = text.split("\n");
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

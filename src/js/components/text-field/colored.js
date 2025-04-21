import React, { useState, useRef, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import { makeStyles } from '@mui/styles';

const cursorStyle = {
  display: 'inline-block',
  width: '2px',
  height: '1.2em',
  backgroundColor: '#2196f3',
  verticalAlign: 'middle',
  animation: 'blink 1s step-end infinite',
  position: 'absolute',
  top: '18px',
  visibility: 'visible',
};

const useStyles = makeStyles((theme) => ({
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  textOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: '16.5px 14px',
    fontFamily: "'Fira Code', monospace",
    fontSize: 'inherit',
    whiteSpace: 'pre',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 1,
  },
  highlightSelection: {
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
  },
  originalInput: {
    color: 'transparent',
    fontFamily: "'Fira Code', monospace",
    position: 'relative',
    zIndex: 2,
    backgroundColor: 'transparent !important',
    caretColor: 'transparent',
  },
  '@global': {
    '@keyframes blink': {
      'from, to': { opacity: 1 },
      '50%': { opacity: 0 },
    },
  },
}));

const TextFieldColored = (props) => {
  const classes = useStyles();
  const { InputProps, value, onChange, ...rest } = props;
  const inputRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const [hasFocus, setHasFocus] = useState(false);
  
  const inputType = InputProps?.type || 'text';
  const isPasswordType = inputType === 'password';
  const handleSelect = (e) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart;
      const end = inputRef.current.selectionEnd;
      setCursorPosition(end);
      setSelectionRange({ start, end });
    }
  };

  const handleFocus = () => {
    setHasFocus(true);
    handleSelect({ target: inputRef.current });
  };

  const handleBlur = () => {
    setHasFocus(false);
  };
  useEffect(() => {
    if (inputRef.current && hasFocus) {
      setCursorPosition(inputRef.current.selectionStart);
      setSelectionRange({
        start: inputRef.current.selectionStart,
        end: inputRef.current.selectionEnd
      });
    }
  }, [value, hasFocus]);

  const getCursorStylePosition = () => {
    if (cursorPosition === null || !hasFocus) return { display: 'none' };
    
    // Measure the text width dynamically
    const textToMeasure = value ? value.substring(0, cursorPosition) : '';
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = getComputedStyle(document.body).getPropertyValue('font-size') + " 'Fira Code', monospace";
    const textWidth = textToMeasure ? context.measureText(textToMeasure).width : 0;
    
    return {
      ...cursorStyle,
      left: `calc(14px + ${textWidth}px)`,
    };
  };

  const renderStyledText = () => {
    if (!value) {
      return hasFocus ? <div style={getCursorStylePosition()} /> : null;
    }
    
    if (isPasswordType) {
      return (
        <>
          {Array.from({length: value.length}).map((_, index) => {
            const isSelected = hasFocus && 
              index >= selectionRange.start && 
              index < selectionRange.end;
            
            return (
              <span 
                key={index} 
                className={isSelected ? classes.highlightSelection : ''}
              >
                •
              </span>
            );
          })}
          {hasFocus && <div style={getCursorStylePosition()} />}
        </>
      );
    }

    return (
      <>
        {Array.from(value).map((char, index) => {
          let color;
          
          if (/[A-Z]/.test(char)) {
            color = '#0072B2';
          } else if (/[a-z]/.test(char)) {
            color = '#E69F00';
          } else if (/[0-9]/.test(char)) {
            color = '#56B4E9';
          } else {
            color = '#D55E00';
          }

          const isSelected = hasFocus && 
            index >= selectionRange.start && 
            index < selectionRange.end;
          
          return (
            <span 
              key={index} 
              style={{ color }} 
              className={isSelected ? classes.highlightSelection : ''}
            >
              {char}
            </span>
          );
        })}
        {hasFocus && <div style={getCursorStylePosition()} />}
      </>
    );
  };

  let localInputProps = InputProps ? { ...InputProps } : {};
  localInputProps.classes = {
    ...(localInputProps.classes || {}),
    input: `${classes.originalInput} ${localInputProps.classes?.input || ''}`,
  };

  localInputProps.onSelect = handleSelect;
  localInputProps.inputRef = inputRef;

  return (
    <div className={classes.wrapper}>
      <div className={classes.textOverlay}>
        {renderStyledText()}
      </div>
      <TextField
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        InputProps={localInputProps}
        {...rest}
      />
    </div>
  );
};

export default TextFieldColored;
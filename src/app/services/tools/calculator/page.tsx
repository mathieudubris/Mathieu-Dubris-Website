"use client";

import React, { useState, useEffect, useCallback } from 'react';
import styles from './Calculator.module.css';

type Operator = '+' | '-' | '×' | '÷' | null;

const Calculator: React.FC = () => {
  const [display, setDisplay] = useState<string>('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);

  const handleNumber = useCallback((num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }, [display, waitingForNewValue]);

  const handleOperator = useCallback((op: Operator) => {
    const inputValue = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const result = calculate();
      setPreviousValue(result);
      setDisplay(String(result));
      addToHistory(`${previousValue} ${getOperatorSymbol(operator)} ${inputValue} = ${result}`);
    }
    
    setOperator(op);
    setWaitingForNewValue(true);
  }, [display, operator, previousValue]);

  const calculate = useCallback(() => {
    const inputValue = parseFloat(display);
    if (previousValue === null || operator === null) return inputValue;

    switch (operator) {
      case '+': return previousValue + inputValue;
      case '-': return previousValue - inputValue;
      case '×': return previousValue * inputValue;
      case '÷': return inputValue !== 0 ? previousValue / inputValue : 0;
      default: return inputValue;
    }
  }, [display, operator, previousValue]);

  const handleEquals = useCallback(() => {
    if (operator === null || previousValue === null) return;

    const result = calculate();
    addToHistory(`${previousValue} ${getOperatorSymbol(operator)} ${parseFloat(display)} = ${result}`);
    
    setDisplay(String(result));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(true);
  }, [calculate, display, operator, previousValue]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
    setHistory([]);
  }, []);

  const handleDecimal = useCallback(() => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, waitingForNewValue]);

  const handleBackspace = useCallback(() => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  }, [display]);

  const handlePercentage = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  }, [display]);

  const handleToggleSign = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(String(-value));
  }, [display]);

  const addToHistory = useCallback((entry: string) => {
    setHistory(prev => [...prev.slice(-2), entry]);
  }, []);

  const getOperatorSymbol = (op: Operator): string => {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '×': return '×';
      case '÷': return '÷';
      default: return '';
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
      else if (e.key === '.') handleDecimal();
      else if (e.key === '+') handleOperator('+');
      else if (e.key === '-') handleOperator('-');
      else if (e.key === '*' || e.key === 'x') handleOperator('×');
      else if (e.key === '/') handleOperator('÷');
      else if (e.key === 'Enter' || e.key === '=') handleEquals();
      else if (e.key === 'Escape' || e.key === 'Delete') handleClear();
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === '%') handlePercentage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumber, handleDecimal, handleOperator, handleEquals, handleClear, handleBackspace, handlePercentage]);

  return (
    <div className={styles.calculatorContainer}>
      <div className={styles.calculatorWrapper}>

        <div className={styles.displaySection}>
          <div className={styles.history}>
            {history.map((entry, index) => (
              <div key={index} className={styles.historyEntry}>{entry}</div>
            ))}
          </div>
          <div className={styles.displayContainer}>
            <div className={styles.expression}>
              {previousValue !== null && operator && (
                <span className={styles.expressionText}>
                  {previousValue} {getOperatorSymbol(operator)}
                </span>
              )}
            </div>
            <div className={styles.display}>
              <span className={styles.displayText}>{display}</span>
            </div>
          </div>
        </div>

        <div className={styles.keypad}>
          <div className={styles.keypadRow}>
            <button 
              className={`${styles.key} ${styles.functionKey}`} 
              onClick={handleClear}
              aria-label="Clear"
            >
              AC
            </button>
            <button 
              className={`${styles.key} ${styles.functionKey}`} 
              onClick={handleBackspace}
              aria-label="Backspace"
            >
              ⌫
            </button>
            <button 
              className={`${styles.key} ${styles.functionKey}`} 
              onClick={handlePercentage}
              aria-label="Percentage"
            >
              %
            </button>
            <button 
              className={`${styles.key} ${styles.operatorKey}`} 
              onClick={() => handleOperator('÷')}
              aria-label="Divide"
            >
              ÷
            </button>
          </div>

          <div className={styles.keypadRow}>
            <button className={styles.key} onClick={() => handleNumber('7')}>7</button>
            <button className={styles.key} onClick={() => handleNumber('8')}>8</button>
            <button className={styles.key} onClick={() => handleNumber('9')}>9</button>
            <button 
              className={`${styles.key} ${styles.operatorKey}`} 
              onClick={() => handleOperator('×')}
              aria-label="Multiply"
            >
              ×
            </button>
          </div>

          <div className={styles.keypadRow}>
            <button className={styles.key} onClick={() => handleNumber('4')}>4</button>
            <button className={styles.key} onClick={() => handleNumber('5')}>5</button>
            <button className={styles.key} onClick={() => handleNumber('6')}>6</button>
            <button 
              className={`${styles.key} ${styles.operatorKey}`} 
              onClick={() => handleOperator('-')}
              aria-label="Subtract"
            >
              −
            </button>
          </div>

          <div className={styles.keypadRow}>
            <button className={styles.key} onClick={() => handleNumber('1')}>1</button>
            <button className={styles.key} onClick={() => handleNumber('2')}>2</button>
            <button className={styles.key} onClick={() => handleNumber('3')}>3</button>
            <button 
              className={`${styles.key} ${styles.operatorKey}`} 
              onClick={() => handleOperator('+')}
              aria-label="Add"
            >
              +
            </button>
          </div>

          <div className={styles.keypadRow}>
            <button 
              className={`${styles.key} ${styles.zeroKey}`} 
              onClick={() => handleNumber('0')}
            >
              0
            </button>
            <button className={styles.key} onClick={handleDecimal}>.</button>
            <button 
              className={`${styles.key} ${styles.equalsKey}`} 
              onClick={handleEquals}
              aria-label="Equals"
            >
              =
            </button>
          </div>

          <div className={styles.keypadRow}>
            <button 
              className={`${styles.key} ${styles.functionKey}`} 
              onClick={handleToggleSign}
              aria-label="Toggle Sign"
            >
              ±
            </button>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default Calculator;
import { useState } from 'react'
import Header from '../components/Header'

export default function CalculatorPage() {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')

  const inputDigit = (d: string) => {
    if (display === '0' && d !== '.') {
      setDisplay(d)
    } else if (d === '.' && display.includes('.')) {
      return
    } else {
      setDisplay(display + d)
    }
  }

  const inputOperator = (op: string) => {
    setExpression(display + ' ' + op + ' ')
    setDisplay('0')
  }

  const calculate = () => {
    try {
      const expr = expression + display
      // 安全计算
      const result = eval(expr.replace(/×/g, '*').replace(/÷/g, '/'))
      setDisplay(String(parseFloat(result.toFixed(8))))
      setExpression('')
    } catch {
      setDisplay('错误')
      setExpression('')
    }
  }

  const clear = () => {
    setDisplay('0')
    setExpression('')
  }

  const toggleSign = () => {
    setDisplay(String(parseFloat(display) * -1))
  }

  const percent = () => {
    setDisplay(String(parseFloat(display) / 100))
  }

  const buttons = [
    { label: 'C', action: clear, type: 'op' },
    { label: '±', action: toggleSign, type: 'op' },
    { label: '%', action: percent, type: 'op' },
    { label: '÷', action: () => inputOperator('÷'), type: 'op' },
    { label: '7', action: () => inputDigit('7'), type: 'num' },
    { label: '8', action: () => inputDigit('8'), type: 'num' },
    { label: '9', action: () => inputDigit('9'), type: 'num' },
    { label: '×', action: () => inputOperator('×'), type: 'op' },
    { label: '4', action: () => inputDigit('4'), type: 'num' },
    { label: '5', action: () => inputDigit('5'), type: 'num' },
    { label: '6', action: () => inputDigit('6'), type: 'num' },
    { label: '−', action: () => inputOperator('-'), type: 'op' },
    { label: '1', action: () => inputDigit('1'), type: 'num' },
    { label: '2', action: () => inputDigit('2'), type: 'num' },
    { label: '3', action: () => inputDigit('3'), type: 'num' },
    { label: '+', action: () => inputOperator('+'), type: 'op' },
    { label: '0', action: () => inputDigit('0'), type: 'num' },
    { label: '.', action: () => inputDigit('.'), type: 'num' },
    { label: '=', action: calculate, type: 'eq' },
  ]

  return (
    <div className="page-enter min-h-screen">
      <Header title="计算器" showBack gradient />

      <div className="px-4 py-4">
        {/* 显示屏 */}
        <div className="card p-6 mb-4">
          <p className="text-right text-sm text-gray-400 h-5">{expression}</p>
          <p className="text-right text-4xl font-bold text-warm-800 truncate">{display}</p>
        </div>

        {/* 按钮区域 */}
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((btn, i) => (
            <button
              key={i}
              onClick={btn.action}
              className={`
                ${btn.label === '0' ? 'col-span-2' : ''}
                h-16 rounded-2xl text-xl font-medium transition-all active:scale-95
                ${btn.type === 'num' ? 'bg-white text-warm-800 shadow-sm' : ''}
                ${btn.type === 'op' ? 'bg-warm-100 text-warm-600' : ''}
                ${btn.type === 'eq' ? 'bg-gradient-to-br from-warm-400 to-warm-500 text-white' : ''}
              `}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

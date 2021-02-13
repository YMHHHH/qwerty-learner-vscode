import { off } from 'process'
import * as vscode from 'vscode'
import cet4 from './assets/dicts/CET4_T.json'

function compareWord(word: string, input: string) {
  // 错误返回错误索引，正确返回-2，未完成输入且无错误返回-1
  // console.log(word, input)
  for (let i = 0; i < word.length; i++) {
    if (typeof input[i] !== 'undefined') {
      if (word[i] !== input[i]) {
        return i
      }
    } else {
      return -1
    }
  }
  return -2
}

function replaceString(str: string, index: number, char: string) {
  return str.substring(0, index) + char + str.substring(index + 1)
}
function highlightError(str: string, errorIndex: number) {
  return `${str.substring(0, errorIndex)} _${str[errorIndex]}_ ${str.substring(errorIndex + 1)}`
}

export function activate(context: vscode.ExtensionContext) {
  const chapterLength = 20
  let isStart = false,
    hasWrong = false,
    chapter = 0,
    order = 0,
    dict = cet4
  let wordList = dict.slice(chapter * chapterLength, (chapter + 1) * chapterLength)
  const wordBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -100)
  const inputBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -101)
  const transBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, -102)

  const setupWord = () => {
    if (order === chapterLength - 1) {
      chapter += 1
      order = 0
      wordList = dict.slice(chapter * chapterLength, (chapter + 1) * chapterLength)
    }
    wordBar.text = `chp.${chapter}  ${order}/${chapterLength}  ${wordList[order].name}`
    inputBar.text = ''
    transBar.text = wordList[order].trans.join('；')
  }

  vscode.workspace.onDidChangeTextDocument((e) => {
    if (isStart) {
      const { uri } = e.document
      const { range, text, rangeLength } = e.contentChanges[0]
      if (rangeLength === 0) {
        // 删除用户输入的字符
        const newRange = new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character + 1)
        const editAction = new vscode.WorkspaceEdit()
        editAction.delete(uri, newRange)
        vscode.workspace.applyEdit(editAction)

        if (!hasWrong && text.length === 1) {
          inputBar.text += text
          const result = compareWord(wordList[order].name, inputBar.text)
          if (result === -2) {
            order++
            setupWord()
          } else if (result >= 0) {
            hasWrong = true
            inputBar.text = highlightError(inputBar.text, result)
            setTimeout(() => {
              hasWrong = false
              setupWord()
            }, 500)
          }
        }
      }
    }
  })

  let start = vscode.commands.registerCommand('qwerty-learner.Start', () => {
    isStart = !isStart
    if (isStart) {
      wordBar.show()
      inputBar.show()
      transBar.show()
      setupWord()
    } else {
      wordBar.hide()
      inputBar.hide()
      transBar.hide()
    }
  })

  context.subscriptions.push(start)
}

// this method is called when your extension is deactivated
export function deactivate() {}
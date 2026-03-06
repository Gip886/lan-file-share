' 静默启动脚本 - 不显示命令行窗口
Set WshShell = CreateObject("WScript.Shell")

' 获取脚本所在目录
strPath = WshShell.ScriptFullName
strDir = Left(strPath, InStrRev(strPath, "\") - 1)
rootDir = Left(strDir, InStrRev(strDir, "\") - 1)

' 检查数据库
Set fso = CreateObject("Scripting.FileSystemObject")
dbPath = rootDir & "\data\database.db"
serverPath = rootDir & "\apps\server"

If Not fso.FileExists(dbPath) Then
    WshShell.Popup "正在初始化数据库，请稍候...", 3, "局域网文件共享系统", 64
    WshShell.CurrentDirectory = serverPath
    WshShell.Run "cmd /c pnpm db:push && pnpm seed", 0, True
End If

' 启动服务（隐藏窗口）
WshShell.CurrentDirectory = serverPath
WshShell.Run "node dist\index.js", 0, False

' 等待服务启动
WScript.Sleep 2000

' 打开浏览器
WshShell.Run "http://localhost:3001", 1, False

' 显示提示
WshShell.Popup "服务已启动！" & vbCrLf & "访问地址: http://localhost:3001" & vbCrLf & vbCrLf & "点击确定关闭此提示窗口。", , "局域网文件共享系统", 64

Set WshShell = Nothing

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

// ==============================================================================
// ⚙️ 全局配置区
// ==============================================================================
const remoteUrl = "http://192.168.110.70:9000/upload/";

// ⚠️ 注意：由于你的项目引擎版本不一致，如果跨度很大（如 2.x 和 3.x），
// 你可能需要在这里做成一个字典，根据项目名分配不同的 CocosCreator.exe 路径。
// 目前暂定一个默认的引擎路径：
const DEFAULT_COCOS_EXE = "D:/ProgramData/cocos/editors/Creator/3.8.7/CocosCreator.exe";

// 🛑 屏蔽列表 (黑名单)：不想被扫描的文件夹名称
const IGNORE_DIRS = [
    'node_modules', 
];

// ==============================================================================
// 1. 动态扫描目录 (以 buildConfig.json 为判定标准)
// ==============================================================================
function getDynamicTasks() {
    const tasks = [];
    const basePath = __dirname; 

    const projectSets = fs.readdirSync(basePath).filter(file => {
        if (IGNORE_DIRS.includes(file)) return false; 
        return fs.statSync(path.join(basePath, file)).isDirectory();
    });

    projectSets.forEach(projectSet => {
        const setPath = path.join(basePath, projectSet);
        const projects = fs.readdirSync(setPath).filter(file => fs.statSync(path.join(setPath, file)).isDirectory());

        projects.forEach(project => {
            const projectPath = path.join(setPath, project);
            const originalConfigPath = path.join(projectPath, 'buildConfig.json');
            
            // 【核心变化】：回归以 buildConfig.json 是否存在作为判定标准
            if (fs.existsSync(originalConfigPath)) {
                const serverProjectName = project.replace(/\./g, ''); 
                tasks.push({
                    name: `[${projectSet}] ${project}`, 
                    value: project,
                    path: projectPath.replace(/\\/g, '/'),
                    projectName: serverProjectName,
                    configPath: originalConfigPath
                });
            }
        });
    });

    return tasks;
}

const allTasks = getDynamicTasks();

// ==============================================================================
// 2. 交互式面板
// ==============================================================================
async function startUI() {
    console.clear();
    console.log("============================================================");
    console.log("🚀 Cocos 极速多工程构建中心 (独立配置版)");
    console.log("============================================================\n");

    if (allTasks.length === 0) {
        console.log("⚠️ 未扫描到任何包含 buildConfig.json 的项目，请检查目录结构！");
        return;
    }

    const answers = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selectedProjects',
            message: '请按【空格】勾选需要打包的项目，按【回车】确认执行：\n  (按 a 全选 / 按 i 反选)',
            pageSize: 20,
            choices: allTasks.map(task => ({ name: task.name, value: task.value })),
            validate: function (answer) {
                if (answer.length < 1) return '⚠️ 必须至少选择一个项目！';
                return true;
            }
        }
    ]);

    const tasksToRun = allTasks.filter(task => answers.selectedProjects.includes(task.value));
    console.log(`\n✅ 已选择 ${tasksToRun.length} 个项目，准备起飞...\n`);
    runBuildPipeline(tasksToRun);
}

// ==============================================================================
// 3. 核心流水线 (读取项目专属配置 -> 注入上传参数 -> 构建 -> 清理临时配置)
// ==============================================================================
function runBuildPipeline(buildTasks) {
    buildTasks.forEach(task => {
        console.log(`\n⏳ [${task.projectName}] 正在处理...`);
        const tempConfigPath = path.join(task.path, 'temp_buildConfig.json'); 

        try {
            // 【核心变化】：读取该项目专属的 buildConfig.json
            const originalConfigString = fs.readFileSync(task.configPath, 'utf-8');
            let configData = JSON.parse(originalConfigString);

            // 无论它原本的配置是什么，强行覆盖远端上传相关的配置，免去手动修改的烦恼
            configData.name = task.projectName; // 确保构建任务名正确
            if (!configData.packages) configData.packages = {};
            if (!configData.packages['quick3_build']) configData.packages['quick3_build'] = {};

            configData.packages['quick3_build'].projectName = task.projectName;
            configData.packages['quick3_build'].remoteAddress = remoteUrl + task.projectName;
            configData.packages['quick3_build'].zipAfterBuild = true;
            configData.packages['quick3_build'].uploadAfterBuild = true;

            // 将混合了上传指令的新配置写入临时文件
            fs.writeFileSync(tempConfigPath, JSON.stringify(configData, null, 2), 'utf-8');
            console.log(`✔️ 已基于项目专属配置注入插件参数: ${configData.packages['quick3_build'].remoteAddress}`);

            // 使用临时配置进行打包
            const buildCmd = `"${DEFAULT_COCOS_EXE}" --project "${task.path}" --build "configPath=${tempConfigPath}"`;
            console.log(`🛠️ 调用引擎无头构建中...\n`);
            
            execSync(buildCmd, { stdio: 'inherit' });

            console.log(`\n✅ [${task.projectName}] 构建及上传彻底执行完毕！\n`);

        } catch (error) {
            console.log(`\n⚠️ 引擎退出状态异常，若服务端已接收到文件则视为成功！`);
        } finally {
            // 删除临时配置文件，保持工程目录干净
            if (fs.existsSync(tempConfigPath)) {
                fs.rmSync(tempConfigPath, { force: true });
            }
        }
        console.log(`============================================================`);
    });

    console.log(`\n🎉 所有任务已执行完毕！\n`);
}

startUI();
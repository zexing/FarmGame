// tools/export_config.js
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// 1. 修正路径规范
const EXCELS_DIR = path.join(__dirname, '../excels');
const OUT_DIR = path.join(__dirname, '../assets/resources/configs');

function exportAllConfigs() {
    // 检查源目录是否存在
    if (!fs.existsSync(EXCELS_DIR)) {
        console.error(`❌ 找不到 Excel 目录: ${EXCELS_DIR}`);
        console.log("请确保在 tools 的上一级目录中创建了 excels 文件夹！");
        return;
    }

    // 确保输出目录存在
    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
    }

    // 2. 读取 excels 目录下的所有文件
    const files = fs.readdirSync(EXCELS_DIR);
    let successCount = 0;

    console.log(`🔍 开始扫描 ${EXCELS_DIR} ...\n`);

    for (const file of files) {
        // 3. 安全过滤：必须是 .xlsx，且不能是打开状态下的临时文件(以 ~$ 开头)
        if (file.endsWith('.xlsx') && !file.startsWith('~$')) {
            const excelPath = path.join(EXCELS_DIR, file);
            // 动态生成对应的 json 文件名
            const jsonName = file.replace('.xlsx', '.json');
            const outPath = path.join(OUT_DIR, jsonName);

            try {
                // 将单个文件的解析逻辑抽离执行
                processSingleExcel(excelPath, outPath, file);
                successCount++;
            } catch (error) {
                console.error(`❌ [失败] 解析 ${file} 时出错: ${error.message}`);
            }
        }
    }

    console.log(`\n🎉 批量导表完成！共成功导出 ${successCount} 个配置文件。`);
}

/**
 * 处理单个 Excel 文件的“紧凑型”解析逻辑
 */
function processSingleExcel(excelPath, outPath, fileName) {
    const workbook = xlsx.readFile(excelPath);
    // 默认读取第一个 Sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // 读取为纯二维数组
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    if (rawData.length < 3) {
        throw new Error("表格格式不符合规范（缺少三行表头）");
    }

    // 提取第 2 行 (索引 1) 作为全局 Keys，并记录有效列的索引
    const rawKeys = rawData[1];
    const validKeys = [];
    const keyIndices = [];
    
    for (let i = 0; i < rawKeys.length; i++) {
        if (rawKeys[i]) {
            validKeys.push(rawKeys[i]);
            keyIndices.push(i);
        }
    }

    const finalData = [];
    // 从第 4 行 (索引 3) 开始读取真实数据
    for (let i = 3; i < rawData.length; i++) {
        const row = rawData[i];
        
        // 过滤空行 (首列没数据的直接跳过)
        if (!row || row[0] === undefined || row[0] === '') continue;

        const rowArray = [];
        for (let j = 0; j < keyIndices.length; j++) {
            const val = row[keyIndices[j]];
            rowArray.push(val !== undefined ? val : null);
        }
        finalData.push(rowArray);
    }

    const compactJson = {
        keys: validKeys,
        data: finalData
    };

    // 极致压缩，无格式化参数
    fs.writeFileSync(outPath, JSON.stringify(compactJson), 'utf-8');
    console.log(`✅ [成功] ${fileName} -> 生成了 ${finalData.length} 条数据`);
}

// 执行主函数
exportAllConfigs();
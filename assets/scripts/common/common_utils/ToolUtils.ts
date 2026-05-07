export class ToolUtils {


   /**************************************************数值相关功能**************************************************/

   //四位数字 小于5是因为带上了小数点
   public static converNumFourDigit(numStr: string) {
      let numSplit = numStr.split('');
      let numArr = [];
      let numSplitIdx = 0;
      let numLength = 0;

      while (numLength < 4) {
         if (numSplit[numSplitIdx]) {
            if (numSplit[numSplitIdx] != '.') {
               numLength += 1;
            }
            numArr.push(numSplit[numSplitIdx]);
         } else {
            numArr.push('0');
            numLength += 1;
         }
         numSplitIdx += 1;
      }
      return numArr.join('');
   }

   /**艺术字数字转换 */
   public static converNumStrBMFont(number: number | string): string {
      let numStr: string;
      if (typeof number === 'number') {
         // 先用 toFixed(2) 保证两位小数，再去掉多余的 0
         numStr = number.toFixed(2).replace(/\.?0+$/, '');
      } else {
         numStr = number;
      }

      // 分割整数部分和小数部分
      const parts = numStr.split('.');

      // 格式化整数部分，用 `/` 分割千位
      const formattedInteger = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '/');

      // 如果有小数部分，用 `:` 分割整数和小数
      const formattedNumber = parts.length > 1 ? `${formattedInteger}:${parts[1]}` : formattedInteger;

      return formattedNumber;
   }

   /**系统字数字转换 */
   public static converNumStrSYSFont(number: number | string): string {
      let numStr: string;
      if (typeof number === 'number') {
         // 先用 toFixed(2) 保证两位小数，再去掉多余的 0
         numStr = number.toFixed(2).replace(/\.?0+$/, '');
      } else {
         numStr = number;
      }

      // 分割整数部分和小数部分
      const parts = numStr.split('.');

      // 格式化整数部分，用 `/` 分割千位
      const formattedInteger = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

      // 如果有小数部分，用 `:` 分割整数和小数
      const formattedNumber = parts.length > 1 ? `${formattedInteger}.${parts[1]}` : formattedInteger;

      return formattedNumber;
   }



   /**************************************************通用函数功能相关功能**************************************************/
   /**给组件调用addEvents事件（单次）**/
   public static addEvents(self: any, call: Function = null) {
      if (!self['_isInitEvents']) {
         self['_isInitEvents'] = true;
         if (call) {
            call.apply(self);
         } else if (self['addEvents']) {
            self['addEvents']();
         }
      }
   }

   /**给组件调用addEvents事件（单次）**/
   public static removeEvents(self: any, call: Function = null) {
      if (self['_isInitEvents']) {
         self['_isInitEvents'] = false;
         if (call) {
            call.apply(self);
         } else if (self['removeEvents']) {
            self['removeEvents']();
         }
      }
   }
   /**
    * 移除对象回调
    * @param self 
    * @param type 
    * @param callback 
    * @param target 
    * @param useCapture 
    */
   public static off(self: any, type: string, callback?: any, target?: unknown, useCapture: any = false) {
      if (self && self.isValid) {
         self.off(type, callback, target, useCapture);
      }

   }

   /**
    * 统一排序函数
    * arr：数据
    * sortArr：排序方式（type：关键字，value：排序方式 -1:升序；1：降序）
    * **/
   public static sortList(arr: any[], sortArr: { type: string, value: number }[]) {
      let type, value;
      arr.sort(function (a: any, b: any) {
         if (!a || !b) {
            return -1;
         }
         for (let i = 0; i < sortArr.length; i++) {
            type = sortArr[i].type;
            value = sortArr[i].value;
            if (a[type] != b[type]) {
               if (value == -1) {
                  return a[type] - b[type];
               } else {
                  return b[type] - a[type];
               }
            }
         }
         return -1;
      });
   }

   /**
    * 奖励物品排序 id 小到大
    */
   public static rewardSort(a, b) {
      if (a.id != b.id) {
         return a.id - b.id;
      }
      return 0;
   }


   /**
    * 乘法 - js运算精度丢失问题
    * @param arg1  数1
    * @param arg2  数2
    * 0.0023 * 100 ==> 0.22999999999999998
    * {{ 0.0023 | multiply(100) }} ==> 0.23
    */
   public static floatMultiply(arg1, arg2) {
      arg1 = Number(arg1);
      arg2 = Number(arg2);
      if ((!arg1 && arg1 !== 0) || (!arg2 && arg2 !== 0)) {
         return null;
      }
      arg1 = ToolUtils.toNonExponential(arg1);
      arg2 = ToolUtils.toNonExponential(arg2);
      var n1, n2;
      var r1, r2; // 小数位数
      try {
         r1 = arg1.toString().split(".")[1].length;
      } catch (e) {
         r1 = 0;
      }
      try {
         r2 = arg2.toString().split(".")[1].length;
      } catch (e) {
         r2 = 0;
      }
      n1 = Number(arg1.toString().replace(".", ""));
      n2 = Number(arg2.toString().replace(".", ""));
      return n1 * n2 / Math.pow(10, r1 + r2);
   }

   /**
    * 除法 - js运算精度丢失问题
    * @param arg1  数1
    * @param arg2  数2
    * 0.0023 / 0.00001 ==> 229.99999999999997
    * {{ 0.0023 | divide(0.00001) }} ==> 230
    */
   public static floatDivide(arg1, arg2) {
      arg1 = Number(arg1);
      arg2 = Number(arg2);
      if (!arg2) {
         return null;
      }
      if (!arg1 && arg1 !== 0) {
         return null;
      } else if (arg1 === 0) {
         return 0;
      }
      arg1 = ToolUtils.toNonExponential(arg1);
      arg2 = ToolUtils.toNonExponential(arg2);
      var n1, n2;
      var r1, r2; // 小数位数
      try {
         r1 = arg1.toString().split(".")[1].length;
      } catch (e) {
         r1 = 0;
      }
      try {
         r2 = arg2.toString().split(".")[1].length;
      } catch (e) {
         r2 = 0;
      }
      n1 = Number(arg1.toString().replace(".", ""));
      n2 = Number(arg2.toString().replace(".", ""));
      return ToolUtils.floatMultiply((n1 / n2), Math.pow(10, r2 - r1));
      // return (n1 / n2) * Math.pow(10, r2 - r1);   // 直接乘法还是会出现精度问题
   }

   /**
    * 加法 - js运算精度丢失问题
    * @param arg1  数1
    * @param arg2  数2
    * 0.0023 + 0.00000000000001 ==> 0.0023000000000099998
    * {{ 0.0023 | plus(0.00000000000001) }} ==> 0.00230000000001
    */
   public static floatAdd(arg1, arg2) {
      arg1 = Number(arg1) || 0;
      arg2 = Number(arg2) || 0;
      arg1 = ToolUtils.toNonExponential(arg1);
      arg2 = ToolUtils.toNonExponential(arg2);
      var r1, r2, m;
      try {
         r1 = arg1.toString().split(".")[1].length;
      } catch (e) {
         r1 = 0;
      }
      try {
         r2 = arg2.toString().split(".")[1].length;
      } catch (e) {
         r2 = 0;
      }
      m = Math.pow(10, Math.max(r1, r2));
      return (ToolUtils.floatMultiply(arg1, m) + ToolUtils.floatMultiply(arg2, m)) / m;
   }

   /**
    * 减法 - js运算精度丢失问题
    * @param arg1  数1
    * @param arg2  数2
    * 0.0023 - 0.00000011  ==>  0.0022998899999999997
    * {{ 0.0023 | minus( 0.00000011 ) }}  ==>  0.00229989
    */
   public static floatSub(arg1, arg2) {
      arg1 = Number(arg1) || 0;
      arg2 = Number(arg2) || 0;
      arg1 = ToolUtils.toNonExponential(arg1);
      arg2 = ToolUtils.toNonExponential(arg2);
      var r1, r2, m, n;
      try {
         r1 = arg1.toString().split(".")[1].length;
      } catch (e) {
         r1 = 0;
      }
      try {
         r2 = arg2.toString().split(".")[1].length;
      } catch (e) {
         r2 = 0;
      }
      m = Math.pow(10, Math.max(r1, r2));
      // 动态控制精度长度
      n = (r1 >= r2) ? r1 : r2;
      return ((ToolUtils.floatMultiply(arg1, m) - ToolUtils.floatMultiply(arg2, m)) / m).toFixed(n);
   }


   /**
    * 取余 - js运算精度丢失问题
    * @param arg1  数1
    * @param arg2  数2
    * 12.24 % 12  ==> 0.2400000000000002
    * {{ 12.24 | mod( -12 ) }}  ==>  0.24
    */
   public static floatMod(arg1, arg2) {
      arg1 = Number(arg1);
      arg2 = Number(arg2);
      if (!arg2) {
         return null;
      }
      if (!arg1 && arg1 !== 0) {
         return null;
      } else if (arg1 === 0) {
         return 0;
      }
      let intNum = arg1 / arg2;
      intNum = intNum < 0 ? Math.ceil(arg1 / arg2) : Math.floor(arg1 / arg2);  // -1.02 取整为 -1; 1.02取整为1
      let intVal = ToolUtils.floatMultiply(intNum, arg2);
      return ToolUtils.floatSub(arg1, intVal);
   }

   /**
    * 将科学计数法的数字转为字符串
    * 说明：运算精度丢失方法中处理数字的时候，如果出现科学计数法，就会导致结果出错  
    * 4.496794759834739e-9  ==> 0.000000004496794759834739
    * 4.496794759834739e+9  ==> 4496794759.834739
    * @param  num 
    */
   public static toNonExponential(num) {
      if (num == null) {
         return num;
      }
      if (typeof num == "number") {
         var m: any = num.toExponential().match(/\d(?:\.(\d*))?e([+-]\d+)/);
         return num.toFixed(Math.max(0, (m[1] || '').length - m[2]));
      } else {
         return num;
      }
   }


   /**
    * 去除占位符返回字符串
    * 处理多语言配置中的占位符替换
    * @param template 带占位符的字符串模板，如 "获得{1}个{2}"
    * @param ...replacements 用于替换占位符的字符串，按顺序替换 {1}, {2}, {3}...
    * @returns 替换后的字符串
    * 
    * 示例:
    * replacePlaceholders("获得{1}个{2}", "10", "金币") => "获得10个金币"
    * replacePlaceholders("玩家{1}在{2}获得了{3}", "张三", "商店", "道具") => "玩家张三在商店获得了道具"
    */
   public static replacePlaceholders(template: string, ...replacements: string[]): string {
      if (!template || typeof template !== 'string') {
         return template || '';
      }

      let result = template;

      // 遍历所有替换参数
      for (let i = 0; i < replacements.length; i++) {
         const placeholder = `{${i + 1}}`;
         const replacement = replacements[i] || '';

         // 使用全局替换，替换所有匹配的占位符
         result = result.replace(new RegExp(this.escapeRegExp(placeholder), 'g'), replacement);
      }

      // 移除未替换的占位符（如果有多余的占位符）
      result = result.replace(/\{\d+\}/g, '');

      return result;
   }

   /**
    * 多语言字符串格式化（按顺序替换占位符）
    * @param template 带占位符的字符串模板
    * @param placeholder 占位符格式，如 "{0}"、"{{0}}"、"%s" 等
    * @param ...params 参数列表，按顺序替换占位符
    * @returns 替换后的字符串
    * 
    * 示例:
    * formatString("获得{0}个{1}", "{0}", "10", "金币") => "获得10个金币"
    * formatString("玩家{{0}}等级{{1}}", "{{0}}", "张三", "20") => "玩家张三等级20" 
    * formatString("Hello %s, you have %s coins", "%s", "John", "100") => "Hello John, you have 100 coins"
    */
   public static formatString(template: string, placeholder: string, ...params: (string | number)[]): string {
      if (!template || typeof template !== 'string') {
         return template || '';
      }
      if (!placeholder) {
         return template;
      }

      let result = template;

      // 按顺序替换占位符
      for (let i = 0; i < params.length; i++) {
         const replacement = String(params[i] || '');

         if (placeholder === '%s') {
            // 处理 %s 格式，按顺序替换第一个匹配项
            result = result.replace('%s', replacement);
         } else {
            // 处理带数字索引的占位符格式，如 {0}, {{0}} 等
            const placeholderPattern = placeholder.replace(/\d+/, i.toString());
            result = result.replace(new RegExp(this.escapeRegExp(placeholderPattern), 'g'), replacement);
         }
      }

      return result;
   }

   /**
    * 移除字符串中的所有占位符
    * @param template 带占位符的字符串
    * @returns 移除占位符后的字符串
    * 
    * 示例:
    * removePlaceholders("获得{1}个{2}奖励") => "获得个奖励"
    * removePlaceholders("玩家{player}获得{item}") => "玩家获得"
    */
   public static removePlaceholders(template: string): string {
      if (!template || typeof template !== 'string') {
         return template || '';
      }

      // 移除 {数字} 和 {字符} 格式的占位符
      return template.replace(/\{[^}]*\}/g, '');
   }

   /**
    * 转义正则表达式特殊字符
    * @param string 需要转义的字符串
    * @returns 转义后的字符串
    */
   private static escapeRegExp(string: string): string {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   }

   public static transformCoinNum(coinNum: number, coinID: number = 100003): string {
      // 统一处理符号和绝对值
      const sign = coinNum < 0 ? '-' : '';
      const absValue = Math.abs(coinNum);
      if (!coinID) coinID = 100003;

      // 根据 coinID 选择格式化规则
      if (coinID === 100002) {
         // 格式化为两位小数 + 千分位（如 1,234.56）
         const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2, maximumFractionDigits: 2
         }).format(absValue / 100);
         return sign + formatted;
      } else if (coinID === 100003) {
         // 格式化为两位小数 + 千分位（如 1,234.56）
         const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2, // 强制显示两位小数
            maximumFractionDigits: 2  // 最多两位小数
         }).format(absValue / 100);
         return sign + formatted;
      }

      // 默认回退逻辑（根据需求补充）
      return sign + absValue.toFixed(2);
   }

}



const fs = require('fs')
const path = require('path')
const BabelParser = require('@babel/parser')
const traverse = require('@babel/traverse').default;
const babelCore = require('@babel/core');
const {transformFromAst} = babelCore

module.exports = class webpack{
    constructor(options){
        console.log(options)
        this.entry = options.entry
        this.output = options.output
        this.moduleInfo = []
    }
    run(){
        const moduleParserInfo = this.parser(this.entry);
        console.log(moduleParserInfo)
        this.moduleInfo.push(moduleParserInfo)
        for(let i=0;i<this.moduleInfo.length;i++){
            const dependencies = this.moduleInfo[i].dependencies
            if(dependencies){
                for(let j in dependencies){
                    this.moduleInfo.push(this.parser(dependencies[j]))
                }
                
            }
        }
        console.log(this.moduleInfo)

        // 数据结构转换，转成对象
        const obj = {}
        this.moduleInfo.forEach(item=>{
            obj[item.modulePath] = {
                dependencies:item.dependencies,
                code: item.code
            }
        })
        this.bundleFile(obj)
    }

    // 编译模块的方法
    parser(modulePath){
        // 1. 分析是否有依赖，有依赖就提取依赖的路径
        //2. 编译生成chunk

        const content = fs.readFileSync(modulePath, 'utf-8')
        console.log(content)
        const ast = BabelParser.parse(content,{ sourceType:"module" })
        console.log(ast.program.body)

        // 保存依赖路径
        const dependencies = {}
        traverse(ast,{
           ImportDeclaration({node}){
                console.log(node);
                // ./other.js ===> ./src/other.js
                // 依赖文件的路径 node.source.value
                const parentPath = path.dirname(modulePath)
                console.log(parentPath, node.source.value)
                const newPath = '.\\'+path.join(parentPath, node.source.value) // 注意此时硬编码的windows路径，windows和mac有所不同
                console.log(newPath)
                dependencies[node.source.value] = newPath

           }
        })

        console.log(dependencies)
        const {code} = transformFromAst(ast, null, {
            presets:['@babel/preset-env']
        })

        console.log(code) // 观察code, 会发现导入import被编译成了require（xxx） 这段代码放入eval会报require未定义，所以之后会先吧require加入

        return{
            modulePath,
            dependencies,
            code
        }

    }


    bundleFile(obj){
        // 生成bundle文件
        const budnlePath = path.join(this.output.path, this.output.filename)
        const dependenciesInfo = JSON.stringify(obj)
        const content = `(function(modulesInfo){
            function require(modulePath){

                function newRequire(relativePath){
                    return require(modulesInfo[modulePath].dependencies[relativePath])
                }

                const exports = {};


                (function(require, code){
                    eval(code)
                })(newRequire, modulesInfo[modulePath].code)

                return exports
            }
            require('${this.entry}') // ./src/index.js
        })(${dependenciesInfo})`
        fs.writeFileSync(budnlePath, content, 'utf-8')

    }
}
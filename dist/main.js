(function(modulesInfo){
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
            require('./src/index.js') // ./src/index.js
        })({"./src/index.js":{"dependencies":{"./other.js":".\\src\\other.js"},"code":"\"use strict\";\n\nvar _other = require(\"./other.js\");\n\nconsole.log(\"hello \".concat(_other.str));\n\nfunction test() {\n  return 'ast';\n}"},".\\src\\other.js":{"dependencies":{},"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.str = void 0;\nvar str = '潘彦祖';\nexports.str = str;"}})
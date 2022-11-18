const path = require("path");

const babel = require("rollup-plugin-babel");
const resolve = require("rollup-plugin-node-resolve");
const { sizeSnapshot } = require("rollup-plugin-size-snapshot");
const typescript = require("rollup-plugin-typescript2");

const createBabelConfig = require("./babel.config");

const { root } = path.parse(process.cwd());
const external = (id) => !id.startsWith(".") && !id.startsWith(root);
const extensions = [".js", ".ts", ".tsx"];
const getBabelOptions = (targets) => ({
  ...createBabelConfig({ env: (env) => env === "build" }, targets),
  extensions,
});

function createESMConfig(input, output) {
  return {
    input,
    output: { file: output, format: "esm" },
    external,
    plugins: [
      typescript(),
      babel(getBabelOptions({ node: 8 })),
      sizeSnapshot(),
      resolve({ extensions }),
    ],
  };
}

function createCommonJSConfig(input, output) {
  return {
    input,
    output: { file: output, format: "cjs", exports: "named" },
    external,
    plugins: [
      typescript(),
      babel(getBabelOptions({ ie: 11 })),
      sizeSnapshot(),
      resolve({ extensions }),
    ],
  };
}

function createIIFEConfig(input, output, globalName) {
  return {
    input,
    output: {
      file: output,
      format: "iife",
      exports: "named",
      name: globalName,
      globals: {
        react: "React",
      },
    },
    external,
    plugins: [
      typescript(),
      babel(getBabelOptions({ ie: 11 })),
      sizeSnapshot(),
      resolve({ extensions }),
    ],
  };
}

module.exports = [
  createESMConfig("src/index.ts", "dist/index.js"),
  createCommonJSConfig("src/index.ts", "dist/index.cjs.js"),
  createIIFEConfig("src/index.ts", "dist/index.iife.js", "chemicalRx"),
];

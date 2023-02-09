module.exports = {
	"env": {
		"browser": true,
		"es6": true
	},
	"extends": [
		"google",
		"plugin:react/recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
		"plugin:import/errors",
		"plugin:import/warnings",
		"plugin:import/typescript",
		"plugin:react-hooks/recommended",
		"plugin:sonarjs/recommended",
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaFeatures": {
			"jsx": true
		},
		"ecmaVersion": 2018,
		"sourceType": "module",
		"project": "tsconfig.json",
		"tsconfigRootDir": "."
	},
	"plugins": [
		"react",
		"@typescript-eslint",
		"babel",
		"import",
		"eslint-plugin-import-helpers",
		"react-hooks",
		"sonarjs",
	],
	"settings": {
		"react": {
			"createClass": "createReactClass",
			"pragma": "React",
			"version": "detect"
		},
		"import/parsers": {
			"@typescript-eslint/parser": [
				".ts",
				".tsx"
			]
		},
		"import/resolver": {
			"typescript": {
				"alwaysTryTypes": true
			}
		}
	},
	"rules": {
		"indent": [
			"error",
			"tab",
			{
				"SwitchCase": 1
			}
		],
		"@typescript-eslint/indent": [
			"error",
			"tab",
			{
				"ignoredNodes": [ "TSTypeParameterInstantiation" ],
				"SwitchCase": 1
			}
		],
		"no-tabs": "off",
		"max-len": "off",
		"object-curly-spacing": [
			"error",
			"always"
		],
		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": [
			"error",
			{
				"vars": "all",
				"args": "none",
				"ignoreRestSiblings": false
			}
		],
		"no-console": "error",
		"no-shadow": "off",
		"curly": ["error", "all"],
		"eol-last": "error",
		"newline-after-var": "error",
		"newline-before-return": "error",
		"consistent-return": "error",
		"padded-blocks": [
			"error",
			{
				"blocks": "never",
				"classes": "always",
				"switches": "never"
			}
		],
		"require-jsdoc": "off",
		"new-cap": [
			"error",
			{
				"capIsNewExceptions": [
					"Translate",
					"TestId",
					"TestAttr",
					"Action",
					"Authorized",
					"Debug",
					"Test",
					"Selector",
					"Platform",
				]
			}
		],
		"newline-per-chained-call": [
			"error",
			{
				"ignoreChainWithDepth": 2
			}
		],
		"no-invalid-this": "off",
		"space-infix-ops": "error",
		"babel/no-invalid-this": [
			"error"
		],
		"operator-linebreak": [
			"error",
			"after",
			{
				"overrides": {
					"?": "before",
					":": "before"
				}
			}
		],
		"babel/semi": [
			"error",
			"always"
		],
		"import/namespace": "off",
		"import/no-duplicates": "error",
		"import/no-unassigned-import": "error",
		"import/no-unresolved": "error",
		"import/named": "error",
		"import/export": "error",
		"import/default": "error",
		"import/no-named-as-default": "error",
		"import/no-named-as-default-member": "error",
		"import/no-named-default": "error",
		"import/no-default-export": "error",
		"import/newline-after-import": "error",
		"import/first": "error",
		"import/no-unused-modules": "error",
		"import-helpers/order-imports": [
			"error",
			{
				"groups": [
					"/^core-js/",
					"/^(react|react-dom|react-router|react-router-dom|redux|react-redux|react-native)$/",
					"module",
					"/^@my/",
					"/^@nervejs/",
					"/^@mydawnfe/",

					"/^@constants/",
					"/^@enums/",
					"/^@utils/",
					"/^@decorators/",
					"/^@hooks/",
					"/^@redux/",
					"/^@mobx/",
					"/^@api/",
					"/^@base/",
					"/^@common/",
					"/^@modules/",
					"/^@lib/",
					"/^@services/",
					"/^@(boosty|streams)/",
					"/^@desktop/",
					"/^@mobile/",
					"/^@web-view/",
					"/^@widgets/",
					"/^@test-api/",
					"/^@tests-base/",
					"/^@loaders/",
					"/^@plugins/",
					"/^@containers/",
					"/^@components/",
					"/^@pages/",
					"/^@ui/",
					"/^@icons/",

					"/^[.](.*?)[/]constants$/",
					"/^[.](.*?)[/]enums$/",
					"/^[.](.*?)[/]utils$/",
					"/^[.](.*?)[/]decorators$/",
					"/^[.](.*?)[/]redux$/",
					"/^[.](.*?)[/]mobx$/",
					"/^[.](.*?)[/]api$/",
					"/^[.](.*?)[/]base$/",
					"/^[.](.*?)[/]common$/",
					"/^[.](.*?)[/]modules/",
					"/^[.](.*?)[/]containers$/",
					"/^[.](.*?)[/]components$/",
					"/^[.](.*?)[/]ui$/",
					"/^[.](.*?)[/]icons$/",
					[
						"parent",
						"sibling",
						"index"
					],

					"/^@interfaces/",
					"/^@fixtures/",

					"/^[.](.*?)[/]interfaces$/",

					"/[.]/types$/",
					"/^[.]/locales/",
					"/[.]scss$/"
				],
				"newlinesBetween": "always",
				"alphabetize": {
					"order": "asc",
					"ignoreCase": true
				}
			}
		],
		"no-multiple-empty-lines": [
			"error",
			{
				"max": 1
			}
		],
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/explicit-module-boundary-types": "off",
		"@typescript-eslint/naming-convention": [
			"error",
			{
				"selector": "interface",
				"format": ["PascalCase"],
				"custom": {
					"regex": "^I[A-Z]",
					"match": true
				}
			}
		],
		"@typescript-eslint/no-empty-interface": "off",
		"@typescript-eslint/no-misused-promises": [
			"error",
			{
				"checksVoidReturn": false
			}
		],
		"@typescript-eslint/unbound-method": "off",
		"@typescript-eslint/prefer-regexp-exec": "off",
		"@typescript-eslint/promise-function-async": [
			"error",
			{
				"allowedPromiseNames": [
					"Thenable"
				],
				"checkArrowFunctions": true,
				"checkFunctionDeclarations": true,
				"checkFunctionExpressions": true,
				"checkMethodDeclarations": true
			}
		],
		"@typescript-eslint/no-floating-promises": [
			"error",
			{
				"ignoreVoid": true
			}
		],
		"@typescript-eslint/no-explicit-any": [
			"error"
		],
		"@typescript-eslint/no-shadow": "error",
		"react/sort-comp": [
			"error",
			{
				"order": [
					"static-variables",
					"instance-variables",
					"static-methods",
					"lifecycle",
					"/^(is|has|can)[A-Z].+$/",
					"/^get.+$/",
					"/^set.+$/",
					"everything-else",
					"/^on.+$/",
					"/^render.+$/",
					"render"
				],
				"groups": {
					"lifecycle": [
						"displayName",
						"propTypes",
						"contextTypes",
						"childContextTypes",
						"mixins",
						"statics",
						"defaultProps",
						"constructor",
						"getDefaultProps",
						"state",
						"getInitialState",
						"getChildContext",
						"getDerivedStateFromProps",
						"componentWillMount",
						"UNSAFE_componentWillMount",
						"componentDidMount",
						"componentWillUnmount",
						"componentWillReceiveProps",
						"UNSAFE_componentWillReceiveProps",
						"shouldComponentUpdate",
						"componentWillUpdate",
						"UNSAFE_componentWillUpdate",
						"getSnapshotBeforeUpdate",
						"componentDidUpdate",
						"componentDidCatch"
					]
				}
			}
		],
		"react/self-closing-comp": [
			"error",
			{
				"component": true,
				"html": true
			}
		],
		"react/prop-types": "off",
		"react-hooks/exhaustive-deps": "off",
		"sonarjs/cognitive-complexity": "off",
	}
};

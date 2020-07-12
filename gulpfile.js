const fs = require('fs-extra')
const path = require('path')
const { series } = require('gulp')
const webpack = require('webpack')
const rimraf = require('rimraf')
const { bundleSource, copyPackageToDist } = require('@gveditor/sdk')
const { exec } = require('child_process')

const pluginsSourceFolder = path.resolve(__dirname, 'plugins')
const pluginDistFolder = path.resolve(__dirname, 'pluginsDist')

async function updatePluginsDependencies(cb) {
	const pluginsFolders = await fs.readdir(pluginsSourceFolder)
	pluginsFolders.forEach(async (pluginName, i) => {
		const pluginDir = path.join(pluginsSourceFolder, pluginName)
		const proc = exec(`cd ${pluginDir} && npm install`)
		await new Promise(res => {
			proc.on('close', () => {
				res()
			})
		})
		if (pluginsFolders.length - 1 === i) {
			cb()
		}
	})
}

async function removePluginsDist(cb) {
	if (fs.existsSync(pluginDistFolder)) {
		rimraf(pluginDistFolder, () => {
			cb()
		})
	}
}

function createPluginsFolder(cb) {
	if (!fs.existsSync(pluginDistFolder)) {
		fs.mkdirSync(pluginDistFolder)
	}
	cb()
}

function createPluginFolder(pluginName) {
	if (!fs.existsSync(path.join(pluginDistFolder, pluginName))) {
		fs.mkdirSync(path.join(pluginDistFolder, pluginName))
	}
}

async function pluginsWebpack() {
	return await new Promise(async (resolve, reject) => {
		const pluginsFolders = await fs.readdir(pluginsSourceFolder)
		pluginsFolders.forEach((pluginName, i) => {
			createPluginFolder(pluginName)
			webpack(require(path.join(pluginsSourceFolder, pluginName, 'webpack.config.js')), async function (a, b) {
				if (pluginsFolders.length - 1 === i) {
					resolve()
				}
			})
		})
	})
}

async function pluginsSDK() {
	return await new Promise(async (resolve, reject) => {
		const pluginsFolders = await fs.readdir(pluginsSourceFolder)
		pluginsFolders.forEach(async (pluginName, i) => {
			const bundleConfig = {
				entryProject: path.join(pluginsSourceFolder, pluginName, 'package.json'),
				distDir: path.join(pluginDistFolder, pluginName),
			}
			await bundleSource(bundleConfig)
			const copyConfig = {
				entryProject: path.join(pluginsSourceFolder, pluginName, 'package.json'),
				dirFolder: path.join(pluginDistFolder, pluginName),
			}
			await copyPackageToDist(copyConfig)
			if (pluginsFolders.length - 1 === i) {
				resolve()
			}
		})
	})
}

async function pluginsTasks() {
	return await new Promise(async (resolve, reject) => {
		const pluginsFolders = await fs.readdir(pluginsSourceFolder)
		pluginsFolders.forEach(async (pluginName, i) => {
			const distFolder = path.join(pluginDistFolder, pluginName)
			const { tasks } = require(path.join(pluginsSourceFolder, pluginName, 'graviton.config.js'))
			tasks.forEach(task => {
				task({
					distFolder,
				})
			})
			if (pluginsFolders.length - 1 === i) {
				resolve()
			}
		})
	})
}

exports.default = series(updatePluginsDependencies, removePluginsDist, createPluginsFolder, pluginsWebpack, pluginsSDK, pluginsTasks)
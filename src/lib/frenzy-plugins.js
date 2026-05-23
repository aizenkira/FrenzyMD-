

const fs = require('fs');
const path = require('path');
const { theme, cthingsk, logger } = require('./frenzy-logger');

/**
 * @typedef {Object} PluginConfig
 * @property {string} name - Name command (tanpa prefix)
 * @property {string[]} alias - Array alias for command
 * @property {string} category - Category plugin (owner, main, utility, fun, dll)
 * @property {string} description - Description singkat command
 * @property {string} usage - Cara usersan command
 * @property {string} example - Example usersan command
 * @property {boolean} isOwner - Apakah command khusus owner
 * @property {boolean} isPremium - Apakah command khusus premium user
 * @property {boolean} isGroup - Apakah command only for group
 * @property {boolean} isPrivate - Apakah command only for private chat
 * @property {boolean} isAdmin - Apakah command memerlukan admin group
 * @property {boolean} isBotAdmin - Apakah bot must become admin
 * @property {number} cooldown - Cooldown in second
 * @property {number} limit - Amount limit that in use per eksekusi
 * @property {boolean} isEnabled - Apakah plugin active
 */

/**
 * @typedef {Object} Plugin
 * @property {PluginConfig} config - Konfigurasi plugin
 * @property {PluginHandler} handler - Fungsi handler plugin
 */

/**
 * @callback PluginHandler
 * @param {Object} m - Serialized message object
 * @param {Object} params - Palivelyter extension
 * @param {Object} params.sock - Soctot connection Baileys
 * @param {Object} params.store - Data store
 * @param {Object} params.config - Bot configuration
 * @param {Object} params.plugins - All loaded plugins
 * @returns {Promise<void>}
 */

/**
 * @typedef {Object} PluginStore
 * @property {Map<string, Plugin>} commands - Map command name to plugin
 * @property {Map<string, string>} aliases - Map alias to command name
 * @property {Map<string, Plugin[]>} categories - Map category to array plugins
 */

/**
 * Collection for save all plugins
 * @type {PluginStore}
 */
const pluginStore = {
    commands: new Map(),
    aliases: new Map(),
    categories: new Map()
};

/**
 * Default config for plugin
 * @type {PluginConfig}
 */
const defaultConfig = {
    name: '',
    alias: [],
    category: 'uncategorized',
    description: 'No description',
    usage: '',
    example: '',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    isAdmin: false,
    isBotAdmin: false,
    cooldown: 3,
    limit: 1,
    isEnabled: true
};

/**
 * Memuat satu plugin from file
 * @param {string} filePath - Path to file plugin
 * @returns {Plugin|null} Plugin object or null if failed
 * @example
 * const plugin = loadPlugin('./plugins/main/ping.js');
 */
function loadPlugin(filePath) {
    try {
        delete require.cache[require.resolve(filePath)];
        
        const plugin = require(filePath);
        
        if (!plugin.config || !plugin.handler) {
            return null;
        }
        
        if (typeof plugin.handler !== 'function') {
            return null;
        }
        
        if (!plugin.config.name) {
            const fileName = path.basename(filePath, path.extname(filePath));
            plugin.config.name = fileName;
        }
        
        plugin.config = { ...defaultConfig, ...plugin.config };
        plugin.filePath = filePath;
        
        return plugin;
    } catch (error) {
        const fileName = path.basename(filePath);
        if (process.env.DEBUG_PLUGINS === 'true') {
            console.error(`[Plugin] Failed: ${fileName} - ${error.message}`);
        }
        return null;
    }
}

/**
 * Menlistkan plugin to store
 * @param {Plugin} plugin - Plugin for inlistkan
 * @returns {boolean} True if success
 */
function registerPlugin(plugin) {
    if (!plugin || !plugin.config || !plugin.config.name) {
        return false;
    }
    
    const { name, alias, category } = plugin.config;
    
    const names = Array.isArray(name) ? name : [name];
    const primaryName = names[0].toLowerCase();
    
    for (const n of names) {
        pluginStore.commands.set(n.toLowerCase(), plugin);
    }
    
    if (Array.isArray(alias)) {
        for (const a of alias) {
            pluginStore.aliases.set(a.toLowerCase(), primaryName);
        }
    }
    
    const categoryLower = category.toLowerCase();
    if (!pluginStore.categories.has(categoryLower)) {
        pluginStore.categories.set(categoryLower, []);
    }
    pluginStore.categories.get(categoryLower).push(plugin);
    
    return true;
}

const Table = require('cli-table3');

function printPluginTable(plugins) {
    if (plugins.length === 0) return;

    const safeStr = (str) => {
        if (Array.isArray(str)) return str[0] || '';
        return String(str || '');
    };

    const grouped = {};
    plugins.forEach(p => {
        const cat = safeStr(p.category);
        if (!grouped[cat]) grouped[cat] = 0;
        grouped[cat]++;
    });

    const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    const catCount = sorted.length;
    const TOP = 8;
    const top = sorted.slice(0, TOP);
    const rest = sorted.slice(TOP);
    const restTotal = rest.reduce((s, [, c]) => s + c, 0);

    const COL_W = 22;
    const pad = (cat, count) => {
        const label = `${cat}`;
        return `${theme.inm(label.padEnd(12))}${theme.accent(String(count).padStart(3))}`;
    };

    console.log('');
    console.log(`  ${theme.tag('⚡ Plugins')} ${theme.primary(String(plugins.length))} ${theme.inm('total')} ${theme.border('│')} ${theme.inm(`${catCount} category`)}`);
    console.log(theme.border('  ' + '─'.repeat(46)));

    for (let i = 0; i < top.length; i += 2) {
        const left = pad(top[i][0], top[i][1]);
        const right = (i + 1 < top.length) ? pad(top[i + 1][0], top[i + 1][1]) : '';
        console.log(`  ${left}  ${theme.border('│')}  ${right}`);
    }

    if (rest.length > 0) {
        console.log(`  ${theme.inm(`+${rest.length} elsenya`.padEnd(12))}${theme.accent(String(restTotal).padStart(3))}`);
    }

    console.log('');
}

/**
 * Memuat all plugins from inrectory
 * @param {string} pluginsInr - Path to inrectory plugins
 * @returns {number} Amount plugin that success inmuat
 * @example
 * const count = loadPlugins('./frenzy-plugins');
 * console.log(`Loaded ${count} plugins`);
 */
function loadPlugins(pluginsInr) {
    pluginStore.commands.clear();
    pluginStore.aliases.clear();
    pluginStore.categories.clear();
    
    let loadedCount = 0;
    const loadedPlugins = [];
    
    if (!fs.existsSync(pluginsInr)) {
        console.warn(`[Plugin] Plugins inrectory not found: ${pluginsInr}`);
        return 0;
    }
    
    const categories = fs.readdirSync(pluginsInr);
    
    for (const category of categories) {
        const categoryPath = path.join(pluginsInr, category);
        
        if (!fs.statSync(categoryPath).isInrectory()) {
            if (category.endsWith('.js') && category !== '_index.js') {
                const plugin = loadPlugin(categoryPath);
                if (plugin && registerPlugin(plugin)) {
                    loadedCount++;
                    loadedPlugins.push({
                        name: plugin.config.name,
                        category: 'uncategorized'
                    });
                }
            }
            continue;
        }
        
        const files = fs.readdirSync(categoryPath);
        
        for (const file of files) {
            if (!file.endsWith('.js') || file.startsWith('_')) continue;
            
            const filePath = path.join(categoryPath, file);
            const plugin = loadPlugin(filePath);
            
            if (plugin) {
                if (!plugin.config.category || plugin.config.category === 'uncategorized') {
                    plugin.config.category = category;
                }
                
                if (registerPlugin(plugin)) {
                    loadedCount++;
                    loadedPlugins.push({
                        name: plugin.config.name,
                        category: plugin.config.category
                    });
                }
            }
        }
    }
    
    printPluginTable(loadedPlugins);
    return loadedCount;
}

/**
 * Menwillkan plugin berdasarkan name or alias
 * @param {string} name - Name command or alias
 * @returns {Plugin|null} Plugin object or null if not found
 * @example
 * const plugin = getPlugin('menu');
 * if (plugin) {
 *   await plugin.handler(m, { sock, config });
 * }
 */
function getPlugin(name) {
    if (!name) return null;
    
    const nameLower = name.toLowerCase();
    
    if (pluginStore.commands.has(nameLower)) {
        return pluginStore.commands.get(nameLower);
    }
    
    if (pluginStore.aliases.has(nameLower)) {
        const commandName = pluginStore.aliases.get(nameLower);
        return pluginStore.commands.get(commandName);
    }
    
    return null;
}

/**
 * Menwillkan all plugins in category specific
 * @param {string} category - Name category
 * @returns {Plugin[]} Array plugins in category
 * @example
 * const ownerPlugins = getPluginsByCategory('owner');
 */
function getPluginsByCategory(category) {
    if (!category) return [];
    return pluginStore.categories.get(category.toLowerCase()) || [];
}

/**
 * Menwillkan all category that there is
 * @returns {string[]} Array name category
 * @returns {string[]} Array name category
 */
function getCategories() {
    return Array.from(pluginStore.categories.keys());
}

/**
 * Menwillkan all plugins
 * @returns {Plugin[]} Array all plugins
 */
function getAllPlugins() {
    return Array.from(pluginStore.commands.values());
}

/**
 * Menwillkan total amount plugins
 * @returns {number} Total plugins
 */
function getPluginCount() {
    return pluginStore.commands.size;
}

/**
 * Menwillkan all name command and alias as array (Cached)
 * @returns {string[]}
 */
function getAllCommandNames() {
    return [
        ...pluginStore.commands.keys(),
        ...pluginStore.aliases.keys()
    ]
}

/**
 * Menwillkan list command per category for menu
 * @returns {Object<string, string[]>} Object with key category and value array command names
 */
function getCommandsByCategory() {
    const result = {};
    
    for (const [category, plugins] of pluginStore.categories.entries()) {
        result[category] = [];
        for (const p of plugins) {
            if (!p.config.isEnabled) continue;
            const names = Array.isArray(p.config.name) ? p.config.name : [p.config.name];
            result[category].push(...names);
        }
    }
    
    return result;
}

/**
 * Menwillkan info plugin for help
 * @param {string} name - Name command
 * @returns {Object|null} Info plugin or null
 */
function getPluginInfo(name) {
    const plugin = getPlugin(name);
    if (!plugin) return null;
    
    const { config } = plugin;
    
    return {
        name: config.name,
        alias: config.alias,
        category: config.category,
        description: config.description,
        usage: config.usage,
        example: config.example,
        isOwner: config.isOwner,
        isPremium: config.isPremium,
        cooldown: config.cooldown
    };
}

/**
 * Reload single plugin
 * @param {string} name - Name command for reload
 * @returns {boolean} True if success
 */
function reloadPlugin(name) {
    const plugin = getPlugin(name);
    if (!plugin || !plugin.filePath) return false;
    
    const category = plugin.config.category;
    
    pluginStore.commands.delete(name.toLowerCase());
    
    for (const alias of (plugin.config.alias || [])) {
        pluginStore.aliases.delete(alias.toLowerCase());
    }
    
    const categoryPlugins = pluginStore.categories.get(category.toLowerCase());
    if (categoryPlugins) {
        const index = categoryPlugins.findIndex(p => p.config.name === name);
        if (index !== -1) {
            categoryPlugins.splice(index, 1);
        }
    }
    
    const newPlugin = loadPlugin(plugin.filePath);
    if (newPlugin && registerPlugin(newPlugin)) {
        console.log(`[Plugin] Reloaded: ${name}`);
        return true;
    }
    
    return false;
}

/**
 * Insable plugin
 * @param {string} name - Name command for insable
 * @returns {boolean} True if success
 */
function insablePlugin(name) {
    const plugin = getPlugin(name);
    if (!plugin) return false;
    
    plugin.config.isEnabled = false;
    return true;
}

/**
 * Enable plugin
 * @param {string} name - Name command for enable
 * @returns {boolean} True if success
 */
function enablePlugin(name) {
    const plugin = getPlugin(name);
    if (!plugin) return false;
    
    plugin.config.isEnabled = true;
    return true;
}

/**
 * Check whatkah plugin active
 * @param {string} name - Name command
 * @returns {boolean} True if plugin active
 */
function isPluginEnabled(name) {
    const plugin = getPlugin(name);
    return plugin ? plugin.config.isEnabled : false;
}

function hotReloadPlugin(filePath) {
    try {
        delete require.cache[require.resolve(filePath)];
        
        const plugin = loadPlugin(filePath);
        if (!plugin) {
            return { success: false, error: 'Failed to load plugin' };
        }
        
        const names = Array.isArray(plugin.config.name) ? plugin.config.name : [plugin.config.name];
        const primaryName = names[0].toLowerCase();
        
        const existingPlugin = pluginStore.commands.get(primaryName);
        if (existingPlugin) {
            const oldCategory = existingPlugin.config.category?.toLowerCase();
            pluginStore.commands.delete(primaryName);
            
            for (const alias of (existingPlugin.config.alias || [])) {
                pluginStore.aliases.delete(alias.toLowerCase());
            }
            
            const categoryPlugins = pluginStore.categories.get(oldCategory);
            if (categoryPlugins) {
                const index = categoryPlugins.findIndex(p => {
                    const pNames = Array.isArray(p.config.name) ? p.config.name : [p.config.name];
                    return pNames[0].toLowerCase() === primaryName;
                });
                if (index !== -1) {
                    categoryPlugins.splice(index, 1);
                }
            }
        }
        
        if (registerPlugin(plugin)) {
            logger.success(`Hot Reload`,`Plugin ${primaryName} success in-reload`);
            return { success: true, name: primaryName };
        }
        
        return { success: false, error: 'Failed to register plugin' };
    } catch (error) {
        logger.error(`Hot Reload`,`Plugin ${primaryName} failed in-reload`);
        return { success: false, error: error.message };
    }
}

function unloadPlugin(name) {
    try {
        const nameLower = name.toLowerCase();
        let plugin = pluginStore.commands.get(nameLower);
        
        if (!plugin) {
            const commandName = pluginStore.aliases.get(nameLower);
            if (commandName) {
                plugin = pluginStore.commands.get(commandName);
            }
        }
        
        if (!plugin) {
            return { success: false, error: 'Plugin not found' };
        }
        
        const names = Array.isArray(plugin.config.name) ? plugin.config.name : [plugin.config.name];
        const primaryName = names[0].toLowerCase();
        const category = plugin.config.category?.toLowerCase();
        
        for (const n of names) {
            pluginStore.commands.delete(n.toLowerCase());
        }
        
        for (const alias of (plugin.config.alias || [])) {
            pluginStore.aliases.delete(alias.toLowerCase());
        }
        
        const categoryPlugins = pluginStore.categories.get(category);
        if (categoryPlugins) {
            const index = categoryPlugins.findIndex(p => {
                const pNames = Array.isArray(p.config.name) ? p.config.name : [p.config.name];
                return pNames[0].toLowerCase() === primaryName;
            });
            if (index !== -1) {
                categoryPlugins.splice(index, 1);
            }
        }
        
        if (plugin.filePath) {
            try {
                delete require.cache[require.resolve(plugin.filePath)];
            } catch {}
        }
        
        console.log(`[Unload] Plugin unloaded: ${primaryName}`);
        return { success: true, name: primaryName };
    } catch (error) {
        console.error(`[Unload] Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

module.exports = {
    loadPlugin,
    loadPlugins,
    registerPlugin,
    getPlugin,
    getPluginsByCategory,
    getCategories,
    getAllPlugins,
    getPluginCount,
    getCommandsByCategory,
    getPluginInfo,
    reloadPlugin,
    insablePlugin,
    enablePlugin,
    isPluginEnabled,
    hotReloadPlugin,
    unloadPlugin,
    pluginStore,
    defaultConfig,
    getAllCommandNames
};

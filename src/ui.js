/**
 * Single-Page Web Dashboard for Cloudflare Task Scheduler
 * Features modern UI with Tailwind CSS, Vue 3, icons, and real-time task manager & log viewer.
 * Fully supports one-click Bilingual (Chinese / English) toggle.
 */

export function renderDashboardHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN" class="h-full bg-slate-50">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CF Task Scheduler</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Vue 3 -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/vue/3.5.12/vue.global.prod.min.js"></script>
  <!-- Phosphor Icons -->
  <script src="https://cdn.jsdelivr.net/npm/@phosphor-icons/web"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#f0f9ff',
              100: '#e0f2fe',
              500: '#0284c7',
              600: '#0369a1',
              700: '#075985',
            }
          }
        }
      }
    }
  </script>
  <style>
    [v-cloak] { display: none !important; }
    pre code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    textarea.code-editor {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      tab-size: 2;
    }
  </style>
</head>
<body class="h-full text-slate-800 antialiased selection:bg-sky-500 selection:text-white">
  <div id="app" v-cloak class="min-h-full flex flex-col">
    
    <!-- 顶部导航栏 -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <i class="ph-bold ph-lightning text-xl"></i>
          </div>
          <div>
            <h1 class="text-lg font-bold text-slate-900 leading-tight">CF Task Scheduler</h1>
            <p class="text-xs text-slate-500">{{ t('appSubtitle') }}</p>
          </div>
        </div>

        <!-- 导航菜单（已登录） -->
        <nav v-if="user" class="hidden md:flex items-center space-x-1">
          <button @click="currentTab = 'tasks'" :class="tabClass('tasks')" class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center space-x-2">
            <i class="ph ph-list-dashes text-lg"></i>
            <span>{{ t('navTasks') }}</span>
          </button>
          <button @click="currentTab = 'logs'" :class="tabClass('logs')" class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center space-x-2">
            <i class="ph ph-scroll text-lg"></i>
            <span>{{ t('navLogs') }}</span>
          </button>
          <button @click="currentTab = 'settings'" :class="tabClass('settings')" class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center space-x-2">
            <i class="ph ph-gear text-lg"></i>
            <span>{{ t('navSettings') }}</span>
          </button>
        </nav>

        <!-- 语言切换与用户操作区 -->
        <div class="flex items-center space-x-3">
          <!-- 中英文切换按钮 -->
          <button @click="toggleLang" class="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition flex items-center space-x-1.5" :title="lang === 'zh' ? 'Switch to English' : '切换为中文'">
            <i class="ph-bold ph-translate text-sm text-sky-600"></i>
            <span>{{ lang === 'zh' ? 'EN' : '中文' }}</span>
          </button>

          <template v-if="user">
            <div class="hidden sm:flex items-center space-x-2 text-xs bg-slate-100 px-2.5 py-1.5 rounded-lg text-slate-600">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{{ user.username }}</span>
            </div>
            <button @click="logout" :title="t('logout')" class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
              <i class="ph-bold ph-sign-out text-lg"></i>
            </button>
          </template>
        </div>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <!-- 1. 系统初始化界面 (首次访问无密码时) -->
      <div v-if="isUninitialized" class="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div class="text-center mb-6">
          <div class="w-14 h-14 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <i class="ph-bold ph-shield-check text-3xl"></i>
          </div>
          <h2 class="text-xl font-bold text-slate-900">{{ t('initTitle') }}</h2>
          <p class="text-xs text-slate-500 mt-1">{{ t('initSubtitle') }}</p>
        </div>

        <div class="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-3 mb-5 flex items-start space-x-2">
          <i class="ph-fill ph-info text-base mt-0.5 flex-shrink-0"></i>
          <span>{{ t('initNote') }}</span>
        </div>

        <form @submit.prevent="handleInit" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">{{ t('username') }}</label>
            <input v-model="initForm.username" type="text" required placeholder="admin" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">{{ t('password') }}</label>
            <input v-model="initForm.password" type="password" required minlength="8" :placeholder="t('passwordMin')" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">{{ t('confirmPassword') }}</label>
            <input v-model="initForm.confirmPassword" type="password" required :placeholder="t('confirmPassword')" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition">
          </div>

          <p v-if="initError" class="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{{ initError }}</p>

          <button type="submit" :disabled="submitting" class="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-xl shadow-md shadow-sky-600/20 transition disabled:opacity-60 flex items-center justify-center space-x-2">
            <span v-if="submitting">{{ t('initializing') }}</span>
            <span v-else>{{ t('initSubmit') }}</span>
          </button>
        </form>
      </div>

      <!-- 2. 登录界面 -->
      <div v-else-if="!user" class="max-w-md mx-auto my-14 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div class="text-center mb-6">
          <div class="w-14 h-14 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-sky-500/20">
            <i class="ph-bold ph-lock-key text-3xl"></i>
          </div>
          <h2 class="text-xl font-bold text-slate-900">{{ t('loginTitle') }}</h2>
          <p class="text-xs text-slate-500 mt-1">{{ t('loginSubtitle') }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">{{ t('username') }}</label>
            <input v-model="loginForm.username" type="text" required placeholder="admin" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">{{ t('password') }}</label>
            <input v-model="loginForm.password" type="password" required placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition">
          </div>

          <p v-if="loginError" class="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{{ loginError }}</p>

          <button type="submit" :disabled="submitting" class="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-xl shadow-md shadow-sky-600/20 transition disabled:opacity-60 flex items-center justify-center space-x-2">
            <span v-if="submitting">{{ t('loggingIn') }}</span>
            <span v-else>{{ t('loginSubmit') }}</span>
          </button>
        </form>
      </div>

      <!-- 3. 已登录管理界面 -->
      <div v-else class="space-y-6">

        <!-- 概览指标卡片 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
            <div class="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-xl">
              <i class="ph-bold ph-stack"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-900">{{ tasks.length }}</div>
              <div class="text-xs text-slate-500 font-medium">{{ t('statTotal') }}</div>
            </div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
            <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
              <i class="ph-bold ph-check-circle"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-900">{{ activeTasksCount }}</div>
              <div class="text-xs text-slate-500 font-medium">{{ t('statActive') }}</div>
            </div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
            <div class="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
              <i class="ph-bold ph-activity"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-900">{{ logs.length }}</div>
              <div class="text-xs text-slate-500 font-medium">{{ t('statLogs') }}</div>
            </div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
            <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
              <i class="ph-bold ph-clock"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-900">{{ t('oneMinute') }}</div>
              <div class="text-xs text-slate-500 font-medium">{{ t('statInterval') }}</div>
            </div>
          </div>
        </div>

        <!-- 任务列表 TAB -->
        <div v-show="currentTab === 'tasks'" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <h2 class="text-base font-bold text-slate-900">{{ t('taskList') }}</h2>
              <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">{{ tasks.length }} {{ t('tasksCount') }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <button @click="loadTasks" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center space-x-1.5 transition">
                <i class="ph ph-arrow-clockwise text-sm"></i>
                <span>{{ t('refresh') }}</span>
              </button>
              <button @click="openCreateModal" class="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium flex items-center space-x-1.5 shadow-sm shadow-sky-600/20 transition">
                <i class="ph-bold ph-plus text-sm"></i>
                <span>{{ t('newTask') }}</span>
              </button>
            </div>
          </div>

          <!-- 任务卡片列表 -->
          <div v-if="tasks.length === 0" class="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
            <div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <i class="ph ph-calendar-blank text-2xl"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-800">{{ t('emptyTasksTitle') }}</h3>
            <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{{ t('emptyTasksDesc') }}</p>
            <button @click="openCreateModal" class="mt-4 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition">
              {{ t('createFirstTask') }}
            </button>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="task in tasks" :key="task.id" class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between">
                  <div class="space-y-1">
                    <div class="flex items-center space-x-2">
                      <span class="font-bold text-slate-900 text-sm">{{ task.name }}</span>
                      <span v-if="task.enabled" class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {{ t('enabled') }}
                      </span>
                      <span v-else class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {{ t('paused') }}
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 line-clamp-1">{{ task.description || t('none') }}</p>
                  </div>

                  <!-- 启用开关 -->
                  <button @click="toggleTaskStatus(task)" :title="task.enabled ? t('paused') : t('enabled')" class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none" :class="task.enabled ? 'bg-sky-600' : 'bg-slate-200'">
                    <span aria-hidden="true" class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" :class="task.enabled ? 'translate-x-4' : 'translate-x-0'"></span>
                  </button>
                </div>

                <!-- 调度详情 -->
                <div class="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div>
                    <span class="text-slate-400 block text-[11px]">{{ t('cronRule') }}</span>
                    <span class="font-mono text-slate-700 font-semibold">{{ task.cron }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-[11px]">{{ t('nextRun') }}</span>
                    <span class="text-slate-700 font-medium">{{ formatTime(task.next_run_at) || t('notReady') }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-[11px]">{{ t('lastStatus') }}</span>
                    <span v-if="task.last_status === 'success'" class="text-emerald-600 font-semibold flex items-center space-x-1">
                      <i class="ph-bold ph-check-circle"></i>
                      <span>{{ t('success') }} ({{ task.last_duration }}ms)</span>
                    </span>
                    <span v-else-if="task.last_status === 'failed'" class="text-rose-600 font-semibold flex items-center space-x-1">
                      <i class="ph-bold ph-x-circle"></i>
                      <span>{{ t('failed') }} ({{ task.last_duration }}ms)</span>
                    </span>
                    <span v-else class="text-slate-400 font-medium">{{ t('never') }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-[11px]">{{ t('lastRunTime') }}</span>
                    <span class="text-slate-700 font-medium">{{ formatTime(task.last_run_at) || t('none') }}</span>
                  </div>
                </div>
              </div>

              <!-- 底部操作按钮 -->
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div class="flex items-center space-x-1">
                  <button @click="runTaskNow(task)" :disabled="taskRunning[task.id]" class="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50">
                    <i class="ph-bold ph-lightning text-amber-500"></i>
                    <span>{{ taskRunning[task.id] ? t('running') : t('testRun') }}</span>
                  </button>
                </div>
                <div class="flex items-center space-x-1">
                  <button @click="editTask(task)" :title="t('edit')" class="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition">
                    <i class="ph ph-pencil-simple text-base"></i>
                  </button>
                  <button @click="deleteTaskConfirm(task)" :title="t('delete')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                    <i class="ph ph-trash text-base"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 执行日志 TAB -->
        <div v-show="currentTab === 'logs'" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <h2 class="text-base font-bold text-slate-900">{{ t('logTitle') }}</h2>
              <select v-model="logFilterTaskId" @change="loadLogs" class="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                <option value="">{{ t('allTasks') }}</option>
                <option v-for="t in tasks" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            <div class="flex items-center space-x-2">
              <button @click="loadLogs" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center space-x-1.5 transition">
                <i class="ph ph-arrow-clockwise text-sm"></i>
                <span>{{ t('refresh') }}</span>
              </button>
              <button @click="clearAllLogs" class="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium flex items-center space-x-1.5 transition">
                <i class="ph ph-trash text-sm"></i>
                <span>{{ t('clearLogs') }}</span>
              </button>
            </div>
          </div>

          <!-- 日志列表表格 -->
          <div class="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div v-if="logs.length === 0" class="p-10 text-center text-slate-400 text-xs">
              {{ t('noLogs') }}
            </div>
            <table v-else class="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th class="py-3 px-4">{{ t('thTask') }}</th>
                  <th class="py-3 px-4">{{ t('thTrigger') }}</th>
                  <th class="py-3 px-4">{{ t('thStatus') }}</th>
                  <th class="py-3 px-4">{{ t('thDuration') }}</th>
                  <th class="py-3 px-4">{{ t('thTime') }}</th>
                  <th class="py-3 px-4 text-right">{{ t('thAction') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr v-for="item in logs" :key="item.id" class="hover:bg-slate-50/80 transition">
                  <td class="py-3 px-4 font-semibold text-slate-900">{{ item.task_name }}</td>
                  <td class="py-3 px-4">
                    <span v-if="item.trigger_type === 'cron'" class="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px]">
                      {{ t('triggerCron') }}
                    </span>
                    <span v-else class="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px]">
                      {{ t('triggerManual') }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <span v-if="item.status === 'success'" class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                      {{ t('success') }}
                    </span>
                    <span v-else class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700">
                      {{ t('failed') }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-slate-500 font-mono">{{ item.duration_ms }}ms</td>
                  <td class="py-3 px-4 text-slate-500">{{ formatTime(item.created_at) }}</td>
                  <td class="py-3 px-4 text-right">
                    <button @click="showLogDetail(item)" class="text-sky-600 hover:text-sky-700 font-semibold">
                      {{ t('viewFullLog') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 系统设置 TAB -->
        <div v-show="currentTab === 'settings'" class="max-w-xl mx-auto space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h3 class="text-sm font-bold text-slate-900 mb-1">{{ t('changePwdTitle') }}</h3>
            <p class="text-xs text-slate-500 mb-4">{{ t('changePwdDesc') }}</p>

            <form @submit.prevent="handleChangePassword" class="space-y-3.5">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">{{ t('oldPwd') }}</label>
                <input v-model="pwdForm.oldPassword" type="password" required class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">{{ t('newPwd') }}</label>
                <input v-model="pwdForm.newPassword" type="password" required minlength="8" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">{{ t('confirmNewPwd') }}</label>
                <input v-model="pwdForm.confirmPassword" type="password" required class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none">
              </div>

              <p v-if="pwdMsg.text" :class="pwdMsg.isError ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'" class="text-xs p-2.5 rounded-lg">{{ pwdMsg.text }}</p>

              <button type="submit" :disabled="submitting" class="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-xl shadow transition">
                {{ t('savePwd') }}
              </button>
            </form>
          </div>

          <!-- 系统时区设置卡片 -->
          <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h3 class="text-sm font-bold text-slate-900 mb-1">{{ t('tzSettingTitle') }}</h3>
            <p class="text-xs text-slate-500 mb-4">{{ t('tzSettingDesc') }}</p>

            <form @submit.prevent="handleSaveTimezone" class="space-y-3.5">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">{{ t('currentTimezone') }}</label>
                <select v-model="selectedTz" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white outline-none">
                  <optgroup :label="lang === 'zh' ? '🌏 亚太地区 (Asia & Pacific)' : '🌏 Asia & Pacific'">
                    <option value="Asia/Shanghai">Asia/Shanghai (UTC+8: 北京 / 上海 / 香港 / 台北 / 新加坡)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (UTC+9: 东京 / 首尔)</option>
                    <option value="Asia/Bangkok">Asia/Bangkok (UTC+7: 曼谷 / 雅加达 / 河内)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30: 印度全境)</option>
                    <option value="Asia/Dubai">Asia/Dubai (UTC+4: 迪拜 / 阿联酋)</option>
                    <option value="Australia/Sydney">Australia/Sydney (UTC+10/+11: 悉尼 / 墨尔本)</option>
                  </optgroup>
                  <optgroup :label="lang === 'zh' ? '🌍 标准与欧洲 (Standard & Europe)' : '🌍 Standard & Europe'">
                    <option value="UTC">UTC (UTC+0: 协调世界时 / 服务器标准)</option>
                    <option value="Europe/London">Europe/London (UTC+0/+1: 伦敦 / 都柏林)</option>
                    <option value="Europe/Paris">Europe/Paris (UTC+1/+2: 巴黎 / 柏林 / 罗马 / 法兰克福)</option>
                    <option value="Europe/Moscow">Europe/Moscow (UTC+3: 莫斯科)</option>
                  </optgroup>
                  <optgroup :label="lang === 'zh' ? '🌎 美洲地区 (Americas)' : '🌎 Americas'">
                    <option value="America/New_York">America/New_York (UTC-5/-4: 纽约 / 美东 EST)</option>
                    <option value="America/Chicago">America/Chicago (UTC-6/-5: 芝加哥 / 美中 CST)</option>
                    <option value="America/Denver">America/Denver (UTC-7/-6: 丹佛 / 山区 MST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (UTC-8/-7: 洛杉矶 / 硅谷 PST)</option>
                    <option value="America/Sao_Paulo">America/Sao_Paulo (UTC-3: 圣保罗 / 巴西利亚)</option>
                  </optgroup>
                  <option value="custom">{{ t('tzCustomOption') }}</option>
                </select>
              </div>

              <!-- 自定义 IANA 时区输入框 -->
              <div v-if="selectedTz === 'custom'">
                <label class="block text-xs font-semibold text-slate-700 mb-1">{{ t('tzCustomLabel') }}</label>
                <input v-model="customTzInput" type="text" required :placeholder="t('tzCustomPlaceholder')" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none font-mono">
              </div>

              <p v-if="tzMsg.text" :class="tzMsg.isError ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'" class="text-xs p-2.5 rounded-lg">{{ tzMsg.text }}</p>

              <button type="submit" :disabled="submitting" class="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-xl shadow transition">
                {{ t('saveTz') }}
              </button>
            </form>
          </div>

          <!-- 环境信息 -->
          <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm text-xs text-slate-600 space-y-2">
            <h4 class="font-bold text-slate-900 mb-2">{{ t('deployInfo') }}</h4>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">{{ t('platform') }}</span>
              <span class="font-mono font-medium">Cloudflare Workers + D1 Database</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">{{ t('securityPolicy') }}</span>
              <span class="font-mono text-emerald-600 font-semibold">{{ t('secPolicyVal') }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">{{ t('timezone') }}</span>
              <span class="font-mono font-semibold text-sky-600">{{ systemTimezone }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">{{ t('cronTrigger') }}</span>
              <span class="font-mono font-medium text-sky-600">Triggers.crons ["* * * * *"]</span>
            </div>
          </div>
        </div>

      </div>

    </main>

    <!-- 弹窗 1: 创建/编辑任务 Modal -->
    <div v-if="showTaskModal" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 class="text-base font-bold text-slate-900">{{ isEditing ? t('modalEditTitle') : t('modalCreateTitle') }}</h3>
            <p class="text-xs text-slate-500">{{ t('modalSubtitle') }}</p>
          </div>
          <button @click="showTaskModal = false" class="text-slate-400 hover:text-slate-600 p-1">
            <i class="ph-bold ph-x text-lg"></i>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">{{ t('taskName') }}</label>
              <input v-model="taskForm.name" type="text" required :placeholder="t('taskNamePlaceholder')" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                {{ t('templateLabel') }}
              </label>
              <select @change="applyTemplate($event.target.value)" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white outline-none">
                <option value="">{{ t('selectTemplate') }}</option>
                <option value="health_check">{{ t('tplHealthCheck') }}</option>
                <option value="http_get">{{ t('tplHttpGet') }}</option>
                <option value="http_post">{{ t('tplHttpPost') }}</option>
                <option value="wecom_notify">{{ t('tplWecom') }}</option>
                <option value="bark_push">{{ t('tplBark') }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">{{ t('taskDesc') }}</label>
            <input v-model="taskForm.description" type="text" :placeholder="t('taskDescPlaceholder')" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none">
          </div>

          <!-- Cron 配置 -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-slate-700">{{ t('cronExpr') }}</label>
              <span class="text-[11px] text-sky-600 font-medium">{{ cronDescription }}</span>
            </div>
            <input v-model="taskForm.cron" type="text" required placeholder="0 8 * * *" class="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none">
            <div class="flex flex-wrap gap-1.5 mt-2">
              <button type="button" @click="setCron('*/10 * * * *')" class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono">{{ t('cronEvery10m') }}</button>
              <button type="button" @click="setCron('0 * * * *')" class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono">{{ t('cronHourly') }}</button>
              <button type="button" @click="setCron('0 8 * * *')" class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono">{{ t('cronDaily08') }}</button>
              <button type="button" @click="setCron('0 9 * * *')" class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono">{{ t('cronDaily09') }}</button>
              <button type="button" @click="setCron('0 9 * * 1-5')" class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono">{{ t('cronWorkdays09') }}</button>
            </div>
          </div>

          <!-- 环境变量 / Secret 配置 -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">{{ t('envLabel') }}</label>
            <textarea v-model="taskForm.env_vars_str" rows="3" placeholder='{"URL": "https://api.example.com", "METHOD": "GET"}' class="code-editor w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white outline-none"></textarea>
          </div>

          <!-- 任务脚本/调度标识 -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-slate-700">{{ t('scriptLabel') }}</label>
              <span class="text-[11px] text-slate-400">{{ t('scriptHint') }}</span>
            </div>
            <textarea v-model="taskForm.script" rows="6" required class="code-editor w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-900 text-slate-100 focus:border-sky-500 outline-none leading-relaxed"></textarea>
          </div>
        </div>

        <div class="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-2">
          <button @click="showTaskModal = false" class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition">
            {{ t('cancel') }}
          </button>
          <button @click="saveTask" :disabled="submitting" class="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md shadow-sky-600/20 transition disabled:opacity-60">
            {{ submitting ? t('saving') : t('save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 弹窗 2: 执行结果 / 日志详情 Modal -->
    <div v-if="activeLogModal" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-slate-950 text-slate-100 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-800">
        <div class="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div class="flex items-center space-x-2">
            <span class="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span class="text-xs font-mono font-bold text-slate-300 ml-2">{{ activeLogModal.task_name }} - {{ t('viewFullLog') }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <button @click="copyLogOutput" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
              {{ copyText }}
            </button>
            <button @click="activeLogModal = null" class="text-slate-400 hover:text-white p-1">
              <i class="ph-bold ph-x text-base"></i>
            </button>
          </div>
        </div>

        <div class="p-4 overflow-y-auto flex-1 font-mono text-xs space-y-2 select-text leading-relaxed">
          <div class="flex items-center space-x-4 pb-2 border-b border-slate-800 text-[11px] text-slate-400">
            <span>{{ t('thStatus') }}: <strong :class="activeLogModal.status === 'success' ? 'text-emerald-400' : 'text-rose-400'">{{ activeLogModal.status }}</strong></span>
            <span>{{ t('thDuration') }}: {{ activeLogModal.duration_ms }}ms</span>
            <span>{{ t('thTime') }}: {{ formatTime(activeLogModal.created_at) }}</span>
          </div>
          <pre class="whitespace-pre-wrap break-all text-slate-200">{{ activeLogModal.output || t('noOutput') }}</pre>
          <div v-if="activeLogModal.error" class="p-3 bg-rose-950/50 border border-rose-900/50 rounded-lg text-rose-300">
            <div class="font-bold text-rose-400 mb-1">❌ {{ t('exceptionDetail') }}</div>
            <pre class="whitespace-pre-wrap">{{ activeLogModal.error }}</pre>
          </div>
        </div>
      </div>
    </div>

  </div>

  <script>
    const { createApp, ref, computed, onMounted } = Vue;

    // Bilingual dictionary (zh / en)
    const i18nDict = {
      zh: {
        appSubtitle: 'Cloudflare 边缘定时任务管理器',
        navTasks: '任务管理',
        navLogs: '执行日志',
        navSettings: '系统设置',
        logout: '退出登录',
        initTitle: '首次使用系统初始化',
        initSubtitle: '请创建首个系统管理员账号与高强度密码',
        initNote: '密码采用 Web Crypto PBKDF2-SHA256 算法经 100,000 次加盐哈希单向存储，绝对不可逆不可解密，请妥善牢记。',
        username: '管理员用户名',
        password: '设置强密码',
        confirmPassword: '确认强密码',
        passwordMin: '至少8位字符',
        initSubmit: '立即初始化并进入工作台',
        initializing: '正在初始化...',
        loginTitle: '管理员登录',
        loginSubtitle: '请输入您的管理密码以继续',
        loginSubmit: '登录管理控制台',
        loggingIn: '正在验证...',
        statTotal: '总任务数',
        statActive: '运行中任务',
        statLogs: '历史执行数',
        statInterval: '调度轮询周期',
        oneMinute: '1 分钟',
        taskList: '定时任务清单',
        tasksCount: '个',
        refresh: '刷新',
        newTask: '新建任务',
        emptyTasksTitle: '暂无定时任务',
        emptyTasksDesc: '点击右上角“新建任务”，快速添加服务健康检查、HTTP 请求、Webhook 或自定义任务。',
        createFirstTask: '立即创建第一个任务',
        enabled: '已启用',
        paused: '已暂停',
        cronRule: 'Cron 规则',
        nextRun: '下次执行',
        lastStatus: '上次状态',
        lastRunTime: '上次运行时间',
        success: '成功',
        failed: '失败',
        never: '尚未执行',
        none: '无',
        notReady: '未就绪',
        testRun: '测试运行',
        running: '执行中...',
        viewLogs: '查看日志',
        edit: '编辑',
        delete: '删除',
        deleteConfirm: '确定要彻底删除该任务及其所有历史日志吗？',
        modalCreateTitle: '新建定时任务',
        modalEditTitle: '编辑任务',
        modalSubtitle: '在边缘计算节点按设定计划全自动执行',
        taskName: '任务名称',
        taskNamePlaceholder: '如：服务可用性探测',
        templateLabel: '选择预设模板 (快速填充)',
        selectTemplate: '-- 选择模板 --',
        tplHealthCheck: '🩺 服务健康检查 (Health Check)',
        tplHttpGet: '🌐 通用 HTTP GET 请求',
        tplHttpPost: '📦 通用 Webhook POST 请求',
        tplWecom: '💬 企业微信机器人通知',
        tplBark: '📱 Bark 移动端推送提醒',
        taskDesc: '任务描述',
        taskDescPlaceholder: '任务功能备注说明',
        cronExpr: 'Cron 调度表达式 (分 时 日 月 周)',
        customExpr: '自定义表达式',
        cronEvery10m: '每10分钟',
        cronHourly: '每小时整点',
        cronDaily08: '每天08:00',
        cronDaily09: '每天09:00',
        cronWorkdays09: '工作日09:00',
        envLabel: '环境变量与凭据 (JSON 格式)',
        scriptLabel: '调度模块标识 / 说明',
        scriptHint: '调度模块: http (通用请求) 或自定义扩展模块',
        cancel: '取消',
        save: '保存任务',
        saving: '保存中...',
        logTitle: '执行历史日志',
        allTasks: '全部任务',
        clearLogs: '清空日志',
        clearLogsConfirm: '确定要清空执行日志吗？',
        noLogs: '暂无执行记录',
        thTask: '任务名称',
        thTrigger: '触发类型',
        thStatus: '状态',
        thDuration: '耗时',
        thTime: '执行时间',
        thAction: '操作',
        triggerCron: '⏰ 定时调度',
        triggerManual: '⚡ 手动测试',
        viewFullLog: '查看完整日志',
        copyAll: '复制全部',
        copied: '已复制！',
        noOutput: '（无输出）',
        exceptionDetail: '异常详情:',
        changePwdTitle: '修改管理员强密码',
        changePwdDesc: '新密码将经过 PBKDF2 100,000 次加盐哈希保存，防暴力破解且不可解密。',
        oldPwd: '当前旧密码',
        newPwd: '新密码 (至少8位)',
        confirmNewPwd: '确认新密码',
        savePwd: '保存并更新密码',
        pwdMismatch: '两次输入的新密码不一致',
        pwdSuccess: '✅ 密码修改成功！下次登录请使用新密码。',
        deployInfo: '部署与运行时信息',
        platform: '运行平台',
        securityPolicy: '密码安全策略',
        secPolicyVal: 'WebCrypto PBKDF2-SHA256 (不可解密)',
        timezone: '时区支持',
        cronTrigger: '定时触发器',
        tzSettingTitle: '系统运行与调度时区',
        tzSettingDesc: '调整系统运行与日志渲染的时区。保存后将自动重新校准所有活动任务的下次执行时间。',
        currentTimezone: '选择系统时区 (IANA Timezone)',
        saveTz: '保存时区并校准调度',
        tzSuccess: '✅ 时区已成功更新，所有活动任务已重新校准调度！',
        tzCustomOption: '⚙️ 手动输入其他 IANA 时区...',
        tzCustomLabel: '输入自定义 IANA 时区标识',
        tzCustomPlaceholder: '如：Pacific/Auckland, Asia/Seoul'
      },
      en: {
        appSubtitle: 'Cloudflare Edge Task Scheduler',
        navTasks: 'Tasks',
        navLogs: 'Logs',
        navSettings: 'Settings',
        logout: 'Sign Out',
        initTitle: 'System Initialization',
        initSubtitle: 'Create the master administrator account and strong password',
        initNote: 'Passwords are irreversibly hashed using Web Crypto PBKDF2-SHA256 with 100,000 salted iterations. It is mathematically impossible to decrypt.',
        username: 'Username',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        passwordMin: 'At least 8 characters',
        initSubmit: 'Initialize & Enter Dashboard',
        initializing: 'Initializing...',
        loginTitle: 'Administrator Sign In',
        loginSubtitle: 'Enter your credentials to continue',
        loginSubmit: 'Sign In to Dashboard',
        loggingIn: 'Verifying...',
        statTotal: 'Total Tasks',
        statActive: 'Active Tasks',
        statLogs: 'Total Runs',
        statInterval: 'Cron Interval',
        oneMinute: '1 Minute',
        taskList: 'Scheduled Tasks',
        tasksCount: 'tasks',
        refresh: 'Refresh',
        newTask: 'New Task',
        emptyTasksTitle: 'No Scheduled Tasks',
        emptyTasksDesc: 'Click "New Task" above to add HTTP requests, health checks, or webhooks.',
        createFirstTask: 'Create First Task',
        enabled: 'Active',
        paused: 'Paused',
        cronRule: 'Cron Rule',
        nextRun: 'Next Run',
        lastStatus: 'Last Status',
        lastRunTime: 'Last Run Time',
        success: 'Success',
        failed: 'Failed',
        never: 'Never Run',
        none: 'None',
        notReady: 'Not Ready',
        testRun: 'Run Now',
        running: 'Running...',
        viewLogs: 'Logs',
        edit: 'Edit',
        delete: 'Delete',
        deleteConfirm: 'Are you sure you want to permanently delete this task and all its history?',
        modalCreateTitle: 'New Scheduled Task',
        modalEditTitle: 'Edit Task',
        modalSubtitle: 'Runs automatically on Cloudflare edge compute nodes',
        taskName: 'Task Name',
        taskNamePlaceholder: 'e.g. Service Health Check',
        templateLabel: 'Starter Templates',
        selectTemplate: '-- Select Template --',
        tplHealthCheck: '🩺 Service Health Check (GET)',
        tplHttpGet: '🌐 Universal HTTP GET',
        tplHttpPost: '📦 Universal Webhook POST',
        tplWecom: '💬 WeCom Bot Webhook',
        tplBark: '📱 Bark Mobile Push Alert',
        taskDesc: 'Description',
        taskDescPlaceholder: 'Optional task notes or description',
        cronExpr: 'Cron Schedule (min hour dom mon dow)',
        customExpr: 'Custom Expression',
        cronEvery10m: 'Every 10m',
        cronHourly: 'Hourly',
        cronDaily08: 'Daily 08:00',
        cronDaily09: 'Daily 09:00',
        cronWorkdays09: 'Workdays 09:00',
        envLabel: 'Environment Variables & Secrets (JSON)',
        scriptLabel: 'Module Identifier / Script',
        scriptHint: 'Module: http (universal) or custom extension module',
        cancel: 'Cancel',
        save: 'Save Task',
        saving: 'Saving...',
        logTitle: 'Execution Logs',
        allTasks: 'All Tasks',
        clearLogs: 'Clear Logs',
        clearLogsConfirm: 'Are you sure you want to clear all execution logs?',
        noLogs: 'No execution records found',
        thTask: 'Task',
        thTrigger: 'Trigger',
        thStatus: 'Status',
        thDuration: 'Duration',
        thTime: 'Executed At',
        thAction: 'Action',
        triggerCron: '⏰ Cron Trigger',
        triggerManual: '⚡ Manual Test',
        viewFullLog: 'View Output',
        copyAll: 'Copy All',
        copied: 'Copied!',
        noOutput: '(No output)',
        exceptionDetail: 'Exception Detail:',
        changePwdTitle: 'Change Master Password',
        changePwdDesc: 'New password is saved via PBKDF2 with 100,000 salted iterations. Irreversible and secure.',
        oldPwd: 'Current Password',
        newPwd: 'New Password (min 8 chars)',
        confirmNewPwd: 'Confirm New Password',
        savePwd: 'Update Password',
        pwdMismatch: 'Passwords do not match',
        pwdSuccess: '✅ Password updated successfully! Use your new password next time.',
        deployInfo: 'Deployment & Runtime Info',
        platform: 'Platform',
        securityPolicy: 'Security Policy',
        secPolicyVal: 'WebCrypto PBKDF2-SHA256 (Irreversible)',
        timezone: 'Timezone',
        cronTrigger: 'Cron Trigger',
        tzSettingTitle: 'System Timezone Settings',
        tzSettingDesc: 'Adjust execution and log rendering timezone. Saving will automatically recalibrate schedules for all active tasks.',
        currentTimezone: 'Select System Timezone (IANA Timezone)',
        saveTz: 'Save Timezone & Recalibrate',
        tzSuccess: '✅ Timezone updated successfully! All active task schedules recalibrated.',
        tzCustomOption: '⚙️ Custom IANA Timezone...',
        tzCustomLabel: 'Enter Custom IANA Timezone Identifier',
        tzCustomPlaceholder: 'e.g. Pacific/Auckland, Asia/Seoul'
      }
    };

    createApp({
      setup() {
        // Detect saved language or browser preference
        const savedLang = localStorage.getItem('cf_task_lang');
        const defaultLang = savedLang || (navigator.language && navigator.language.startsWith('zh') ? 'zh' : 'en');
        const lang = ref(defaultLang);

        const t = (key) => {
          return (i18nDict[lang.value] && i18nDict[lang.value][key]) || (i18nDict['en'] && i18nDict['en'][key]) || key;
        };

        const toggleLang = () => {
          lang.value = lang.value === 'zh' ? 'en' : 'zh';
          localStorage.setItem('cf_task_lang', lang.value);
        };

        const user = ref(null);
        const isUninitialized = ref(false);
        const currentTab = ref('tasks');
        const tasks = ref([]);
        const logs = ref([]);
        const submitting = ref(false);
        const taskRunning = ref({});
        const logFilterTaskId = ref('');

        const initForm = ref({ username: 'admin', password: '', confirmPassword: '' });
        const initError = ref('');
        const loginForm = ref({ username: 'admin', password: '' });
        const loginError = ref('');
        const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });
        const pwdMsg = ref({ text: '', isError: false });

        const systemTimezone = ref(localStorage.getItem('cf_task_tz') || 'Asia/Shanghai');
        const selectedTz = ref(systemTimezone.value);
        const customTzInput = ref('');
        const tzMsg = ref({ text: '', isError: false });

        const showTaskModal = ref(false);
        const isEditing = ref(false);
        const activeLogModal = ref(null);
        const copyText = ref('复制全部');

        const taskForm = ref({
          id: null,
          name: '',
          description: '',
          cron: '0 8 * * *',
          script: 'http',
          env_vars_str: '{}'
        });

        const activeTasksCount = computed(() => tasks.value.filter(t => t.enabled).length);

        const cronDescription = computed(() => {
          const c = taskForm.value.cron.trim();
          const isEn = lang.value === 'en';
          if (c === '* * * * *') return isEn ? 'Every minute' : '每分钟执行一次';
          if (c.startsWith('*/') && c.endsWith('* * * *')) {
            const step = c.split(' ')[0].replace('*/', '');
            return isEn ? \`Every \${step} minutes\` : \`每 \${step} 分钟执行一次\`;
          }
          if (c === '0 * * * *') return isEn ? 'Every hour on the hour' : '每小时整点执行';
          if (c === '0 8 * * *') return isEn ? 'Every day at 08:00' : '每天 08:00 执行';
          if (c === '0 9 * * *') return isEn ? 'Every day at 09:00' : '每天 09:00 执行';
          if (c === '0 9 * * 1-5') return isEn ? 'Weekdays (Mon-Fri) at 09:00' : '工作日 09:00 执行';
          return t('customExpr');
        });

        const tabClass = (tab) => {
          return currentTab.value === tab 
            ? 'bg-sky-50 text-sky-700 shadow-sm' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';
        };

        const formatTime = (ts) => {
          if (!ts) return '';
          try {
            let s = String(ts).trim();
            // Standardize SQLite "YYYY-MM-DD HH:MM:SS" UTC format to valid ISO with Z
            if (!s.includes('T') && !s.includes('Z')) {
              s = s.replace(' ', 'T') + 'Z';
            } else if (s.includes('T') && !s.endsWith('Z') && !s.includes('+')) {
              s += 'Z';
            }
            const d = new Date(s);
            if (isNaN(d.getTime())) return ts;

            const locale = lang.value === 'zh' ? 'zh-CN' : 'en-US';
            return new Intl.DateTimeFormat(locale, {
              timeZone: systemTimezone.value || 'Asia/Shanghai',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).format(d).replaceAll('/', '-');
          } catch {
            return ts;
          }
        };

        const checkAuth = async () => {
          try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.timezone) {
              systemTimezone.value = data.timezone;
              const knownTzs = ['Asia/Shanghai', 'Asia/Tokyo', 'Asia/Bangkok', 'Asia/Kolkata', 'Asia/Dubai', 'Australia/Sydney', 'UTC', 'Europe/London', 'Europe/Paris', 'Europe/Moscow', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo'];
              if (knownTzs.includes(data.timezone)) {
                selectedTz.value = data.timezone;
              } else {
                selectedTz.value = 'custom';
                customTzInput.value = data.timezone;
              }
              localStorage.setItem('cf_task_tz', data.timezone);
            }
            if (data.uninitialized) {
              isUninitialized.value = true;
            } else if (data.user) {
              user.value = data.user;
              await loadTasks();
              await loadLogs();
            }
          } catch (e) {
            console.error('Auth check error', e);
          }
        };

        const handleInit = async () => {
          initError.value = '';
          if (initForm.value.password !== initForm.value.confirmPassword) {
            initError.value = t('pwdMismatch');
            return;
          }
          submitting.value = true;
          try {
            const res = await fetch('/api/auth/init', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(initForm.value)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Initialization failed');
            user.value = data.user;
            isUninitialized.value = false;
            await loadTasks();
          } catch (e) {
            initError.value = e.message;
          } finally {
            submitting.value = false;
          }
        };

        const handleLogin = async () => {
          loginError.value = '';
          submitting.value = true;
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(loginForm.value)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            user.value = data.user;
            await loadTasks();
            await loadLogs();
          } catch (e) {
            loginError.value = e.message;
          } finally {
            submitting.value = false;
          }
        };

        const logout = async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          user.value = null;
        };

        const loadTasks = async () => {
          try {
            const res = await fetch('/api/tasks');
            const data = await res.json();
            tasks.value = data.tasks || [];
          } catch (e) {
            console.error('Load tasks failed', e);
          }
        };

        const loadLogs = async () => {
          try {
            const url = logFilterTaskId.value 
              ? \`/api/logs?taskId=\${logFilterTaskId.value}\` 
              : '/api/logs';
            const res = await fetch(url);
            const data = await res.json();
            logs.value = data.logs || [];
          } catch (e) {
            console.error('Load logs failed', e);
          }
        };

        const setCron = (expr) => {
          taskForm.value.cron = expr;
        };

        const applyTemplate = async (templateKey) => {
          if (!templateKey) return;
          try {
            const res = await fetch('/api/templates/' + templateKey);
            const tpl = await res.json();
            taskForm.value.name = tpl.name;
            taskForm.value.description = tpl.description;
            taskForm.value.cron = tpl.cron;
            taskForm.value.script = tpl.script;
            taskForm.value.env_vars_str = JSON.stringify(tpl.env_vars || {}, null, 2);
          } catch (e) {
            alert('Failed to load template');
          }
        };

        const openCreateModal = () => {
          isEditing.value = false;
          taskForm.value = {
            id: null,
            name: '',
            description: '',
            cron: '0 8 * * *',
            script: 'http',
            env_vars_str: JSON.stringify({
              URL: 'https://httpbin.org/get',
              METHOD: 'GET'
            }, null, 2)
          };
          showTaskModal.value = true;
        };

        const editTask = (task) => {
          isEditing.value = true;
          taskForm.value = {
            id: task.id,
            name: task.name,
            description: task.description || '',
            cron: task.cron,
            script: task.script,
            env_vars_str: task.env_vars || '{}'
          };
          showTaskModal.value = true;
        };

        const saveTask = async () => {
          if (!taskForm.value.name || !taskForm.value.cron || !taskForm.value.script) {
            alert(lang.value === 'zh' ? '请完整填写名称、Cron 规则与执行模块' : 'Please complete name, cron schedule, and module');
            return;
          }
          try {
            JSON.parse(taskForm.value.env_vars_str);
          } catch {
            alert(lang.value === 'zh' ? '环境变量必须是合法的 JSON 格式' : 'Environment variables must be valid JSON');
            return;
          }

          submitting.value = true;
          try {
            const url = isEditing.value ? \`/api/tasks/\${taskForm.value.id}\` : '/api/tasks';
            const method = isEditing.value ? 'PUT' : 'POST';
            const res = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: taskForm.value.name,
                description: taskForm.value.description,
                cron: taskForm.value.cron,
                script: taskForm.value.script,
                env_vars: taskForm.value.env_vars_str
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save');
            showTaskModal.value = false;
            await loadTasks();
          } catch (e) {
            alert(e.message);
          } finally {
            submitting.value = false;
          }
        };

        const toggleTaskStatus = async (task) => {
          try {
            const res = await fetch(\`/api/tasks/\${task.id}/toggle\`, { method: 'POST' });
            if (!res.ok) throw new Error('Operation failed');
            await loadTasks();
          } catch (e) {
            alert(e.message);
          }
        };

        const deleteTaskConfirm = async (task) => {
          if (!confirm(t('deleteConfirm'))) return;
          try {
            const res = await fetch(\`/api/tasks/\${task.id}\`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            await loadTasks();
          } catch (e) {
            alert(e.message);
          }
        };

        const runTaskNow = async (task) => {
          taskRunning.value[task.id] = true;
          try {
            const res = await fetch(\`/api/tasks/\${task.id}/run\`, { method: 'POST' });
            const logItem = await res.json();
            activeLogModal.value = logItem;
            copyText.value = t('copyAll');
            await loadTasks();
            await loadLogs();
          } catch (e) {
            alert(e.message);
          } finally {
            taskRunning.value[task.id] = false;
          }
        };

        const showLogDetail = (logItem) => {
          activeLogModal.value = logItem;
          copyText.value = t('copyAll');
        };

        const copyLogOutput = () => {
          if (!activeLogModal.value) return;
          navigator.clipboard.writeText(activeLogModal.value.output + (activeLogModal.value.error ? '\\n\\n' + activeLogModal.value.error : ''));
          copyText.value = t('copied');
          setTimeout(() => { copyText.value = t('copyAll'); }, 2000);
        };

        const clearAllLogs = async () => {
          if (!confirm(t('clearLogsConfirm'))) return;
          try {
            await fetch('/api/logs', { method: 'DELETE' });
            await loadLogs();
          } catch (e) {
            alert(e.message);
          }
        };

        const handleChangePassword = async () => {
          pwdMsg.value = { text: '', isError: false };
          if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
            pwdMsg.value = { text: t('pwdMismatch'), isError: true };
            return;
          }
          submitting.value = true;
          try {
            const res = await fetch('/api/auth/password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pwdForm.value)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update password');
            pwdMsg.value = { text: t('pwdSuccess'), isError: false };
            pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
          } catch (e) {
            pwdMsg.value = { text: e.message, isError: true };
          } finally {
            submitting.value = false;
          }
        };

        const handleSaveTimezone = async () => {
          tzMsg.value = { text: '', isError: false };
          const targetTz = selectedTz.value === 'custom' ? customTzInput.value.trim() : selectedTz.value;
          if (!targetTz) {
            tzMsg.value = { text: lang.value === 'zh' ? '请输入有效的时区名称' : 'Please provide a valid timezone name', isError: true };
            return;
          }

          // Client-side quick check
          try {
            new Intl.DateTimeFormat('en-US', { timeZone: targetTz });
          } catch {
            tzMsg.value = { text: lang.value === 'zh' ? '无效的 IANA 时区标识 (如 Asia/Shanghai, UTC)' : 'Invalid IANA timezone identifier', isError: true };
            return;
          }

          submitting.value = true;
          try {
            const res = await fetch('/api/settings/timezone', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ timezone: targetTz })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update timezone');
            systemTimezone.value = data.timezone;
            const knownTzs = ['Asia/Shanghai', 'Asia/Tokyo', 'Asia/Bangkok', 'Asia/Kolkata', 'Asia/Dubai', 'Australia/Sydney', 'UTC', 'Europe/London', 'Europe/Paris', 'Europe/Moscow', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo'];
            if (knownTzs.includes(data.timezone)) {
              selectedTz.value = data.timezone;
            } else {
              selectedTz.value = 'custom';
              customTzInput.value = data.timezone;
            }
            localStorage.setItem('cf_task_tz', data.timezone);
            tzMsg.value = { text: t('tzSuccess'), isError: false };
            await loadTasks();
          } catch (e) {
            tzMsg.value = { text: e.message, isError: true };
          } finally {
            submitting.value = false;
          }
        };

        onMounted(() => {
          copyText.value = t('copyAll');
          checkAuth();
        });

        return {
          lang,
          t,
          toggleLang,
          user,
          isUninitialized,
          currentTab,
          tasks,
          logs,
          submitting,
          taskRunning,
          logFilterTaskId,
          initForm,
          initError,
          loginForm,
          loginError,
          pwdForm,
          pwdMsg,
          systemTimezone,
          selectedTz,
          customTzInput,
          tzMsg,
          handleSaveTimezone,
          showTaskModal,
          isEditing,
          activeLogModal,
          copyText,
          taskForm,
          activeTasksCount,
          cronDescription,
          tabClass,
          formatTime,
          handleInit,
          handleLogin,
          logout,
          loadTasks,
          loadLogs,
          setCron,
          applyTemplate,
          openCreateModal,
          editTask,
          saveTask,
          toggleTaskStatus,
          deleteTaskConfirm,
          runTaskNow,
          showLogDetail,
          copyLogOutput,
          clearAllLogs,
          handleChangePassword
        };
      }
    }).mount('#app');
  </script>
</body>
</html>
`;
}

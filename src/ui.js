/**
 * Single-Page Web Dashboard for Cloudflare Task Scheduler
 * Features modern UI with Tailwind CSS, Vue 3, icons, and real-time task manager & log viewer.
 */

export function renderDashboardHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN" class="h-full bg-slate-50">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cloudflare 定时任务工作台 - CF Task Scheduler</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Vue 3 -->
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
  <!-- Phosphor Icons -->
  <script src="https://unpkg.com/@phosphor-icons/web"></script>
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
            <p class="text-xs text-slate-500">Cloudflare 边缘定时任务管理器</p>
          </div>
        </div>

        <!-- 导航菜单（已登录） -->
        <nav v-if="user" class="hidden md:flex items-center space-x-1">
          <button @click="currentTab = 'tasks'" :class="tabClass('tasks')" class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center space-x-2">
            <i class="ph ph-list-dashes text-lg"></i>
            <span>任务管理</span>
          </button>
          <button @click="currentTab = 'logs'" :class="tabClass('logs')" class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center space-x-2">
            <i class="ph ph-scroll text-lg"></i>
            <span>执行日志</span>
          </button>
          <button @click="currentTab = 'settings'" :class="tabClass('settings')" class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center space-x-2">
            <i class="ph ph-gear text-lg"></i>
            <span>系统设置</span>
          </button>
        </nav>

        <!-- 用户操作区 -->
        <div v-if="user" class="flex items-center space-x-3">
          <div class="hidden sm:flex items-center space-x-2 text-xs bg-slate-100 px-2.5 py-1.5 rounded-lg text-slate-600">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{{ user.username }}</span>
          </div>
          <button @click="logout" title="退出登录" class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
            <i class="ph-bold ph-sign-out text-lg"></i>
          </button>
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
          <h2 class="text-xl font-bold text-slate-900">首次使用系统初始化</h2>
          <p class="text-xs text-slate-500 mt-1">请创建首个系统管理员账号与高强度密码</p>
        </div>

        <div class="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-3 mb-5 flex items-start space-x-2">
          <i class="ph-fill ph-info text-base mt-0.5 flex-shrink-0"></i>
          <span>密码采用 <strong>Web Crypto PBKDF2-SHA256</strong> 算法经 100,000 次加盐哈希单向存储，<strong>绝对不可逆不可解密</strong>，请妥善牢记。</span>
        </div>

        <form @submit.prevent="handleInit" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">管理员用户名</label>
            <input v-model="initForm.username" type="text" required placeholder="admin" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">设置强密码</label>
            <input v-model="initForm.password" type="password" required minlength="8" placeholder="至少8位字符" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">确认强密码</label>
            <input v-model="initForm.confirmPassword" type="password" required placeholder="请再次输入密码" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition">
          </div>

          <p v-if="initError" class="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{{ initError }}</p>

          <button type="submit" :disabled="submitting" class="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-xl shadow-md shadow-sky-600/20 transition disabled:opacity-60 flex items-center justify-center space-x-2">
            <span v-if="submitting">正在初始化...</span>
            <span v-else>立即初始化并进入工作台</span>
          </button>
        </form>
      </div>

      <!-- 2. 登录界面 -->
      <div v-else-if="!user" class="max-w-md mx-auto my-14 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div class="text-center mb-6">
          <div class="w-14 h-14 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-sky-500/20">
            <i class="ph-bold ph-lock-key text-3xl"></i>
          </div>
          <h2 class="text-xl font-bold text-slate-900">管理员登录</h2>
          <p class="text-xs text-slate-500 mt-1">请输入您的管理密码以继续</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">用户名</label>
            <input v-model="loginForm.username" type="text" required placeholder="admin" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">密码</label>
            <input v-model="loginForm.password" type="password" required placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition">
          </div>

          <p v-if="loginError" class="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{{ loginError }}</p>

          <button type="submit" :disabled="submitting" class="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-xl shadow-md shadow-sky-600/20 transition disabled:opacity-60 flex items-center justify-center space-x-2">
            <span v-if="submitting">正在验证...</span>
            <span v-else>登录管理控制台</span>
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
              <div class="text-xs text-slate-500 font-medium">总任务数</div>
            </div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
            <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
              <i class="ph-bold ph-check-circle"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-900">{{ activeTasksCount }}</div>
              <div class="text-xs text-slate-500 font-medium">运行中任务</div>
            </div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
            <div class="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
              <i class="ph-bold ph-activity"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-900">{{ logs.length }}</div>
              <div class="text-xs text-slate-500 font-medium">历史执行数</div>
            </div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
            <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
              <i class="ph-bold ph-clock"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-900">1 分钟</div>
              <div class="text-xs text-slate-500 font-medium">调度轮询周期</div>
            </div>
          </div>
        </div>

        <!-- 任务列表 TAB -->
        <div v-show="currentTab === 'tasks'" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <h2 class="text-base font-bold text-slate-900">定时任务清单</h2>
              <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">{{ tasks.length }} 个</span>
            </div>
            <div class="flex items-center space-x-2">
              <button @click="loadTasks" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center space-x-1.5 transition">
                <i class="ph ph-arrow-clockwise text-sm"></i>
                <span>刷新</span>
              </button>
              <button @click="openCreateModal" class="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium flex items-center space-x-1.5 shadow-sm shadow-sky-600/20 transition">
                <i class="ph-bold ph-plus text-sm"></i>
                <span>新建任务</span>
              </button>
            </div>
          </div>

          <!-- 任务卡片列表 -->
          <div v-if="tasks.length === 0" class="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
            <div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <i class="ph ph-calendar-blank text-2xl"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-800">暂无定时任务</h3>
            <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">点击右上角的“新建任务”，快速添加新债申购提醒、极氪签到、T00ls 签到、集思录监控或通用 HTTP 接口任务。</p>
            <button @click="openCreateModal" class="mt-4 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition">
              立即创建第一个任务
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
                        已启用
                      </span>
                      <span v-else class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        已暂停
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 line-clamp-1">{{ task.description || '无任务描述' }}</p>
                  </div>

                  <!-- 启用开关 -->
                  <button @click="toggleTaskStatus(task)" :title="task.enabled ? '点击暂停' : '点击启用'" class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none" :class="task.enabled ? 'bg-sky-600' : 'bg-slate-200'">
                    <span aria-hidden="true" class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" :class="task.enabled ? 'translate-x-4' : 'translate-x-0'"></span>
                  </button>
                </div>

                <!-- 调度详情 -->
                <div class="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div>
                    <span class="text-slate-400 block text-[11px]">Cron 规则</span>
                    <span class="font-mono text-slate-700 font-semibold">{{ task.cron }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-[11px]">下次执行</span>
                    <span class="text-slate-700 font-medium">{{ formatTime(task.next_run_at) || '未就绪' }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-[11px]">上次状态</span>
                    <span v-if="task.last_status === 'success'" class="text-emerald-600 font-semibold flex items-center space-x-1">
                      <i class="ph-bold ph-check-circle"></i>
                      <span>成功 ({{ task.last_duration }}ms)</span>
                    </span>
                    <span v-else-if="task.last_status === 'failed'" class="text-rose-600 font-semibold flex items-center space-x-1">
                      <i class="ph-bold ph-x-circle"></i>
                      <span>失败 ({{ task.last_duration }}ms)</span>
                    </span>
                    <span v-else class="text-slate-400 font-medium">尚未执行</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-[11px]">上次运行时间</span>
                    <span class="text-slate-700 font-medium">{{ formatTime(task.last_run_at) || '无' }}</span>
                  </div>
                </div>
              </div>

              <!-- 底部操作按钮 -->
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div class="flex items-center space-x-1">
                  <button @click="runTaskNow(task)" :disabled="taskRunning[task.id]" class="px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold flex items-center space-x-1 transition disabled:opacity-50">
                    <i class="ph-bold ph-lightning text-amber-500"></i>
                    <span>{{ taskRunning[task.id] ? '执行中...' : '测试运行' }}</span>
                  </button>
                  <button @click="viewTaskLogs(task.id)" class="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 text-xs font-medium flex items-center space-x-1 transition">
                    <i class="ph ph-file-text"></i>
                    <span>查看日志</span>
                  </button>
                </div>
                <div class="flex items-center space-x-1">
                  <button @click="editTask(task)" title="编辑" class="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition">
                    <i class="ph ph-pencil-simple text-base"></i>
                  </button>
                  <button @click="deleteTaskConfirm(task)" title="删除" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
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
              <h2 class="text-base font-bold text-slate-900">执行历史日志</h2>
              <select v-model="logFilterTaskId" @change="loadLogs" class="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                <option value="">全部任务</option>
                <option v-for="t in tasks" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            <div class="flex items-center space-x-2">
              <button @click="loadLogs" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center space-x-1.5 transition">
                <i class="ph ph-arrow-clockwise text-sm"></i>
                <span>刷新</span>
              </button>
              <button @click="clearAllLogs" class="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium flex items-center space-x-1.5 transition">
                <i class="ph ph-trash text-sm"></i>
                <span>清空日志</span>
              </button>
            </div>
          </div>

          <!-- 日志列表表格 -->
          <div class="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div v-if="logs.length === 0" class="p-10 text-center text-slate-400 text-xs">
              暂无执行记录
            </div>
            <table v-else class="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th class="py-3 px-4">任务名称</th>
                  <th class="py-3 px-4">触发类型</th>
                  <th class="py-3 px-4">状态</th>
                  <th class="py-3 px-4">耗时</th>
                  <th class="py-3 px-4">执行时间</th>
                  <th class="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr v-for="item in logs" :key="item.id" class="hover:bg-slate-50/80 transition">
                  <td class="py-3 px-4 font-semibold text-slate-900">{{ item.task_name }}</td>
                  <td class="py-3 px-4">
                    <span v-if="item.trigger_type === 'cron'" class="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px]">
                      ⏰ 定时调度
                    </span>
                    <span v-else class="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px]">
                      ⚡ 手动测试
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <span v-if="item.status === 'success'" class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                      成功
                    </span>
                    <span v-else class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700">
                      失败
                    </span>
                  </td>
                  <td class="py-3 px-4 text-slate-500 font-mono">{{ item.duration_ms }}ms</td>
                  <td class="py-3 px-4 text-slate-500">{{ formatTime(item.created_at) }}</td>
                  <td class="py-3 px-4 text-right">
                    <button @click="showLogDetail(item)" class="text-sky-600 hover:text-sky-700 font-semibold">
                      查看完整日志
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
            <h3 class="text-sm font-bold text-slate-900 mb-1">修改管理员强密码</h3>
            <p class="text-xs text-slate-500 mb-4">新密码将经过 PBKDF2 100,000 次加盐哈希保存，防暴力破解且不可解密。</p>

            <form @submit.prevent="handleChangePassword" class="space-y-3.5">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">当前旧密码</label>
                <input v-model="pwdForm.oldPassword" type="password" required class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">新密码 (至少8位)</label>
                <input v-model="pwdForm.newPassword" type="password" required minlength="8" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">确认新密码</label>
                <input v-model="pwdForm.confirmPassword" type="password" required class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none">
              </div>

              <p v-if="pwdMsg.text" :class="pwdMsg.isError ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'" class="text-xs p-2.5 rounded-lg">{{ pwdMsg.text }}</p>

              <button type="submit" :disabled="submitting" class="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-xl shadow transition">
                保存并更新密码
              </button>
            </form>
          </div>

          <!-- 环境信息 -->
          <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm text-xs text-slate-600 space-y-2">
            <h4 class="font-bold text-slate-900 mb-2">部署与运行时信息</h4>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">运行平台</span>
              <span class="font-mono font-medium">Cloudflare Workers + D1 Database</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">密码安全策略</span>
              <span class="font-mono text-emerald-600 font-semibold">WebCrypto PBKDF2-SHA256 (不可解密)</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">时区支持</span>
              <span class="font-mono font-medium">Asia/Shanghai (UTC+8)</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">定时触发器</span>
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
            <h3 class="text-base font-bold text-slate-900">{{ isEditing ? '编辑任务' : '新建定时任务' }}</h3>
            <p class="text-xs text-slate-500">在边缘计算节点按设定计划全自动执行</p>
          </div>
          <button @click="showTaskModal = false" class="text-slate-400 hover:text-slate-600 p-1">
            <i class="ph-bold ph-x text-lg"></i>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">任务名称</label>
              <input v-model="taskForm.name" type="text" required placeholder="如：今日新债申购提醒" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                选择预设模板 (快速填充)
              </label>
              <select @change="applyTemplate($event.target.value)" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white outline-none">
                <option value="">-- 选择模板 --</option>
                <option value="health_check">🩺 服务健康检查 (Health Check)</option>
                <option value="http_get">🌐 通用 HTTP GET 请求</option>
                <option value="http_post">📦 通用 Webhook POST 请求</option>
                <option value="wecom_notify">💬 企业微信机器人通知</option>
                <option value="bark_push">📱 Bark 移动端推送提醒</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">任务描述</label>
            <input v-model="taskForm.description" type="text" placeholder="任务功能备注说明" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none">
          </div>

          <!-- Cron 配置 -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-slate-700">Cron 调度表达式 (分 时 日 月 周)</label>
              <span class="text-[11px] text-sky-600 font-medium">{{ cronDescription }}</span>
            </div>
            <input v-model="taskForm.cron" type="text" required placeholder="0 8 * * *" class="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none">
            <div class="flex flex-wrap gap-1.5 mt-2">
              <button type="button" @click="setCron('*/10 * * * *')" class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono">每10分钟</button>
              <button type="button" @click="setCron('0 * * * *')" class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono">每小时整点</button>
              <button type="button" @click="setCron('0 8 * * *')" class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono">每天08:00</button>
              <button type="button" @click="setCron('15 9 * * 1-5')" class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono">工作日09:15</button>
              <button type="button" @click="setCron('0 9 * * 1-5')" class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono">工作日09:00</button>
            </div>
          </div>

          <!-- 环境变量 / Secret 配置 -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">环境变量与凭据 (JSON 格式)</label>
            <textarea v-model="taskForm.env_vars_str" rows="3" placeholder='{"TOKEN": "Bearer xxx", "WECOM_WEBHOOK": "https://..."}' class="code-editor w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white outline-none"></textarea>
          </div>

          <!-- 任务脚本/调度标识 -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-slate-700">调度模块标识 / 说明</label>
              <span class="text-[11px] text-slate-400">调度模块: http (通用请求) 或自定义扩展模块</span>
            </div>
            <textarea v-model="taskForm.script" rows="8" required class="code-editor w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-900 text-slate-100 focus:border-sky-500 outline-none leading-relaxed"></textarea>
          </div>
        </div>

        <div class="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-2">
          <button @click="showTaskModal = false" class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition">
            取消
          </button>
          <button @click="saveTask" :disabled="submitting" class="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md shadow-sky-600/20 transition disabled:opacity-60">
            {{ submitting ? '保存中...' : '保存任务' }}
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
            <span class="text-xs font-mono font-bold text-slate-300 ml-2">{{ activeLogModal.task_name }} - 执行输出</span>
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
            <span>状态: <strong :class="activeLogModal.status === 'success' ? 'text-emerald-400' : 'text-rose-400'">{{ activeLogModal.status }}</strong></span>
            <span>耗时: {{ activeLogModal.duration_ms }}ms</span>
            <span>时间: {{ formatTime(activeLogModal.created_at) }}</span>
          </div>
          <pre class="whitespace-pre-wrap break-all text-slate-200">{{ activeLogModal.output || '（无输出输出）' }}</pre>
          <div v-if="activeLogModal.error" class="p-3 bg-rose-950/50 border border-rose-900/50 rounded-lg text-rose-300">
            <div class="font-bold text-rose-400 mb-1">❌ 异常详情:</div>
            <pre class="whitespace-pre-wrap">{{ activeLogModal.error }}</pre>
          </div>
        </div>
      </div>
    </div>

  </div>

  <script>
    const { createApp, ref, computed, onMounted } = Vue;

    createApp({
      setup() {
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

        const showTaskModal = ref(false);
        const isEditing = ref(false);
        const activeLogModal = ref(null);
        const copyText = ref('复制全部');

        const taskForm = ref({
          id: null,
          name: '',
          description: '',
          cron: '0 8 * * *',
          script: '',
          env_vars_str: '{}'
        });

        const activeTasksCount = computed(() => tasks.value.filter(t => t.enabled).length);

        const cronDescription = computed(() => {
          const c = taskForm.value.cron.trim();
          if (c === '* * * * *') return '每分钟执行一次';
          if (c.startsWith('*/') && c.endsWith('* * * *')) return \`每 \${c.split(' ')[0].replace('*/', '')} 分钟执行一次\`;
          if (c === '0 * * * *') return '每小时整点执行';
          if (c === '0 8 * * *') return '每天 08:00 执行';
          if (c === '15 9 * * 1-5') return '工作日 09:15 执行';
          if (c === '0 9 * * 1-5') return '工作日 09:00 执行';
          return '自定义表达式';
        });

        const tabClass = (tab) => {
          return currentTab.value === tab 
            ? 'bg-sky-50 text-sky-700 shadow-sm' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';
        };

        const formatTime = (ts) => {
          if (!ts) return '';
          const d = new Date(ts);
          return d.toLocaleString('zh-CN', { hour12: false });
        };

        const checkAuth = async () => {
          try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
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
            initError.value = '两次输入的密码不一致';
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
            if (!res.ok) throw new Error(data.error || '初始化失败');
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
            if (!res.ok) throw new Error(data.error || '登录失败');
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
            console.error('加载任务失败', e);
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
            console.error('加载日志失败', e);
          }
        };

        const setCron = (expr) => {
          taskForm.value.cron = expr;
        };

        const applyTemplate = async (templateKey) => {
          if (!templateKey) return;
          try {
            const res = await fetch('/api/templates/' + templateKey);
            const t = await res.json();
            taskForm.value.name = t.name;
            taskForm.value.description = t.description;
            taskForm.value.cron = t.cron;
            taskForm.value.script = t.script;
            taskForm.value.env_vars_str = JSON.stringify(t.env_vars || {}, null, 2);
          } catch (e) {
            alert('加载模板失败');
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
            alert('请完整填写名称、Cron 规则与执行脚本');
            return;
          }
          try {
            JSON.parse(taskForm.value.env_vars_str);
          } catch {
            alert('环境变量必须是合法 JSON 格式，如 {"KEY": "VALUE"}');
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
            if (!res.ok) throw new Error(data.error || '保存失败');
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
            if (!res.ok) throw new Error('操作失败');
            await loadTasks();
          } catch (e) {
            alert(e.message);
          }
        };

        const deleteTaskConfirm = async (task) => {
          if (!confirm(\`确定要彻底删除任务 "\${task.name}" 及其所有历史日志吗？\`)) return;
          try {
            const res = await fetch(\`/api/tasks/\${task.id}\`, { method: 'DELETE' });
            if (!res.ok) throw new Error('删除失败');
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
            await loadTasks();
            await loadLogs();
          } catch (e) {
            alert('执行出错: ' + e.message);
          } finally {
            taskRunning.value[task.id] = false;
          }
        };

        const showLogDetail = (logItem) => {
          activeLogModal.value = logItem;
        };

        const copyLogOutput = () => {
          if (!activeLogModal.value) return;
          navigator.clipboard.writeText(activeLogModal.value.output + (activeLogModal.value.error ? '\\n\\n' + activeLogModal.value.error : ''));
          copyText.value = '已复制！';
          setTimeout(() => { copyText.value = '复制全部'; }, 2000);
        };

        const clearAllLogs = async () => {
          if (!confirm('确定要清空执行日志吗？')) return;
          try {
            await fetch('/api/logs', { method: 'DELETE' });
            await loadLogs();
          } catch (e) {
            alert('清空日志失败: ' + e.message);
          }
        };

        const handleChangePassword = async () => {
          pwdMsg.value = { text: '', isError: false };
          if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
            pwdMsg.value = { text: '两次输入的新密码不一致', isError: true };
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
            if (!res.ok) throw new Error(data.error || '修改密码失败');
            pwdMsg.value = { text: '✅ 密码修改成功！下次登录请使用新密码。', isError: false };
            pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
          } catch (e) {
            pwdMsg.value = { text: e.message, isError: true };
          } finally {
            submitting.value = false;
          }
        };

        onMounted(() => {
          checkAuth();
        });

        return {
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

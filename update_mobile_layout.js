const fs = require('fs');

const filePath = 'app/dashboard/sites/[id]/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const startMarker = '<div className="block md:hidden space-y-6">';
const endMarker = '<div className="hidden md:block">';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find markers");
    process.exit(1);
}

const replacement = `<div className="block md:hidden space-y-6 pb-20">
                        {/* Hero Preview Card */}
                        <div className="relative w-full aspect-[4/3] rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden shadow-2xl">
                            {previewUrl ? (
                                <iframe src={previewUrl} className="w-full h-full border-0 pointer-events-none" title="Live Preview" tabIndex={-1} />
                            ) : (
                                <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/50">
                                    <Globe className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                    <p className="text-sm text-muted-foreground/50">Not deployed</p>
                                </div>
                            )}

                            {previewUrl && (
                                <div className="absolute bottom-6 left-0 flex items-center bg-[#10a37f] text-white pl-2 pr-4 py-2 rounded-r-lg font-medium text-sm shadow-lg">
                                    <div className="h-5 w-5 bg-transparent border-2 border-white rotate-45 mr-3 shrink-0" />
                                    Your site is now live!
                                </div>
                            )}
                        </div>

                        {/* Domain Row */}
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded bg-zinc-800 border border-white/10 shrink-0" />
                                <span className="font-medium text-zinc-100">{displayUrl || 'Domain.com'}</span>
                            </div>
                            <Button
                                variant="secondary"
                                className="h-8 px-4 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm"
                                onClick={() => previewUrl && window.open(previewUrl, "_blank")}
                                disabled={!previewUrl}
                            >
                                Visit
                            </Button>
                        </div>

                        {/* Edit Style with AI Box */}
                        <div
                            className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-colors shadow-sm"
                            onClick={() => setActiveTab("ai")}
                        >
                            <Sparkles className="h-8 w-8 text-zinc-400 mb-3" />
                            <span className="text-zinc-300 font-medium">Edit style with AI</span>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="aspect-square bg-zinc-900 border border-white/5 rounded-2xl flex flex-col items-center justify-center p-4">
                                <Eye className="h-6 w-6 text-zinc-500 mb-2" />
                                <span className="text-xs text-zinc-400 font-medium">Webview</span>
                                <span className="text-sm text-zinc-200 font-bold mt-1">{stats.visitors}</span>
                            </div>
                            <div className="aspect-square bg-zinc-900 border border-white/5 rounded-2xl flex flex-col items-center justify-center p-4">
                                <BarChart3 className="h-6 w-6 text-zinc-500 mb-2" />
                                <span className="text-xs text-zinc-400 font-medium">Revenue</span>
                                <span className="text-sm text-zinc-200 font-bold mt-1">$0</span>
                            </div>
                            <div className="aspect-square bg-zinc-900 border border-white/5 rounded-2xl flex flex-col items-center justify-center p-4">
                                <MessageSquare className="h-6 w-6 text-zinc-500 mb-2" />
                                <span className="text-xs text-zinc-400 font-medium">Message</span>
                                <span className="text-sm text-zinc-200 font-bold mt-1">0</span>
                            </div>
                        </div>

                        {/* Conditional Deploy Controls */}
                        {(!previewUrl || hasDeployError) && (
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="space-y-2 relative">
                                  <Button
                                      size="lg"
                                      className={cn("w-full h-14 font-semibold text-base shadow-lg shadow-primary/10 rounded-xl transition-all", deploySuccess && "bg-green-500/20 text-green-400 border-green-500/30", hasDeployError && !isDeploying && !deploySuccess && "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30")}
                                      onClick={hasDeployError ? startAutoFix : handleDeploy}
                                      disabled={isDeploying}
                                  >
                                      {isDeploying ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Deploying...</> : deploySuccess ? <><CheckCircle2 className="h-5 w-5 mr-2" /> Deployed!</> : hasDeployError ? <><Sparkles className="h-5 w-5 mr-2" /> Fix with AI</> : <><Rocket className="h-5 w-5 mr-2" /> Deploy to GitHub</>}
                                  </Button>
                                  {(isDeploying || deploySuccess) && <Progress value={deployProgress} className={cn("h-1.5 rounded-full", deploySuccess ? "[&>div]:bg-green-500" : "")} />}
                                </div>
                                {deployError && (
                                  <div className="text-center space-y-2">
                                     <p className="text-sm text-destructive">{deployError}</p>
                                     {!hasDeployError && <Button variant="link" size="sm" onClick={startAutoFix} className="text-blue-400 h-auto p-0">Try fixing with AI</Button>}
                                  </div>
                                )}
                            </div>
                        )}
                    </div>

                    `;

const newContent = content.slice(0, startIndex) + replacement + content.slice(endIndex);
fs.writeFileSync(filePath, newContent);
console.log("Successfully updated mobile layout!");

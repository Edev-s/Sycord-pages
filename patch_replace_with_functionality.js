const fs = require('fs');
const filepath = 'app/dashboard/sites/[id]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const searchBlock = `                    <div className="block md:hidden px-2 space-y-8 mt-4">
                        {/* Main Preview Container */}
                        <div className="relative w-full aspect-[4/3] rounded-3xl bg-[#1c1c1e] shadow-lg overflow-visible">

                            {previewUrl ? (
                                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                                    <iframe src={previewUrl} className="w-[300%] h-[300%] origin-top-left scale-[0.33] border-0" title="Mini Preview" tabIndex={-1} />
                                </div>
                            ) : null}

                            {/* Green Banner */}
                            <div className="absolute -bottom-1 -left-4 md:-left-6 flex items-center h-10 bg-[#0ea5e9] rounded-r-xl rounded-l-md shadow-lg pr-4 pl-3" style={{backgroundColor: "#10b981", zIndex: 10}}>
                                {/* Diamond icon cut-out effect */}
                                <div className="absolute -left-3 h-6 w-6 transform rotate-45 border-[3px] border-[#10b981] bg-[#1c1c1e] flex items-center justify-center"></div>
                                <span className="text-white font-medium text-sm ml-4 tracking-wide">Your site is now live!</span>
                            </div>
                        </div>

                        {/* Domain Row */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-4">
                                {/* Checkbox-like rounded square */}
                                <div className="h-7 w-7 rounded-lg bg-[#3a3a3c] flex-shrink-0"></div>
                                <span className="text-white text-base font-medium">{displayUrl || 'Domain.com'}</span>
                            </div>
                            {/* Small Action Button */}
                            <button
                                className="h-8 w-20 rounded-lg bg-[#2c2c2e] hover:bg-[#3a3a3c] transition-colors flex-shrink-0 border border-white/5"
                                onClick={() => previewUrl && window.open(previewUrl, "_blank")}
                            ></button>
                        </div>

                        {/* Large Action Rectangle */}
                        <div className="w-full h-[88px] rounded-2xl bg-[#1c1c1e] border border-white/5 shadow-sm"></div>

                        {/* Three Smaller Squares */}
                        <div className="flex justify-between items-center gap-4">
                            <div className="flex-1 aspect-[1.25] rounded-xl bg-[#1c1c1e] border border-white/5 shadow-sm"></div>
                            <div className="flex-1 aspect-[1.25] rounded-xl bg-[#1c1c1e] border border-white/5 shadow-sm"></div>
                            <div className="flex-1 aspect-[1.25] rounded-xl bg-[#1c1c1e] border border-white/5 shadow-sm"></div>
                        </div>

                        <div className="h-4"></div> {/* Bottom spacing */}
                    </div>`;

const replaceBlock = `                    <div className="block md:hidden px-2 space-y-8 mt-4">
                        {/* Main Preview Container */}
                        <div className="relative w-full aspect-[4/3] rounded-3xl bg-[#1c1c1e] shadow-lg overflow-visible">

                            {previewUrl ? (
                                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                                    <iframe src={previewUrl} className="w-[300%] h-[300%] origin-top-left scale-[0.33] border-0" title="Mini Preview" tabIndex={-1} />
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-3xl">
                                    <div className="text-sm text-muted-foreground/50 flex flex-col items-center">
                                        <Globe className="h-8 w-8 mb-2 opacity-50" />
                                        <span>No Preview Available</span>
                                    </div>
                                </div>
                            )}

                            {/* Green Banner */}
                            <div className="absolute -bottom-1 -left-4 md:-left-6 flex items-center h-10 bg-[#0ea5e9] rounded-r-xl rounded-l-md shadow-lg pr-4 pl-3" style={{backgroundColor: "#10b981", zIndex: 10}}>
                                {/* Diamond icon cut-out effect */}
                                <div className="absolute -left-3 h-6 w-6 transform rotate-45 border-[3px] border-[#10b981] bg-[#1c1c1e] flex items-center justify-center"></div>
                                <span className="text-white font-medium text-sm ml-4 tracking-wide">
                                    {deploySuccess ? "Your site is now live!" : hasDeployError ? "Deployment Failed" : isDeploying ? "Deploying..." : "Not Deployed Yet"}
                                </span>
                            </div>
                        </div>

                        {/* Domain Row */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-4">
                                {/* Checkbox-like rounded square */}
                                <div className={cn("h-7 w-7 rounded-lg flex-shrink-0 flex items-center justify-center", previewUrl ? "bg-[#3a3a3c]" : "bg-[#2c2c2e]")}>
                                    {previewUrl && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                </div>
                                <span className="text-white text-base font-medium truncate max-w-[150px]">{displayUrl || 'Domain.com'}</span>
                            </div>
                            {/* Small Action Button */}
                            <Button
                                variant="ghost"
                                className="h-8 w-20 rounded-lg bg-[#2c2c2e] hover:bg-[#3a3a3c] transition-colors flex-shrink-0 border border-white/5 text-xs text-white p-0"
                                onClick={() => previewUrl && window.open(previewUrl, "_blank")}
                                disabled={!previewUrl}
                            >
                                <ExternalLink className="h-3 w-3 mr-1" /> Visit
                            </Button>
                        </div>

                        {/* Large Action Rectangle */}
                        <div className="w-full min-h-[88px] rounded-2xl bg-[#1c1c1e] border border-white/5 shadow-sm p-3 flex flex-col justify-center gap-2">
                              <Button
                                  size="lg"
                                  className={cn("w-full h-12 font-semibold text-sm shadow-sm rounded-xl transition-all", deploySuccess ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30" : hasDeployError && !isDeploying && !deploySuccess ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" : "bg-[#2c2c2e] text-white hover:bg-[#3a3a3c]")}
                                  onClick={hasDeployError ? startAutoFix : handleDeploy}
                                  disabled={isDeploying}
                              >
                                  {isDeploying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deploying...</> : deploySuccess ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Deployed!</> : hasDeployError ? <><Sparkles className="h-4 w-4 mr-2" /> Fix with AI</> : <><Rocket className="h-4 w-4 mr-2" /> Deploy to GitHub</>}
                              </Button>
                              {(isDeploying || deploySuccess) && <Progress value={deployProgress} className={cn("h-1.5 rounded-full", deploySuccess ? "[&>div]:bg-green-500" : "")} />}
                              {deployError && (
                                <div className="text-center">
                                   <p className="text-xs text-destructive truncate">{deployError}</p>
                                </div>
                              )}
                        </div>

                        {/* Three Smaller Squares */}
                        <div className="flex justify-between items-center gap-4">
                            <div className="flex-1 aspect-[1.25] rounded-xl bg-[#1c1c1e] border border-white/5 shadow-sm flex flex-col items-center justify-center p-2 text-center">
                                <Eye className="h-5 w-5 text-muted-foreground mb-1" />
                                <span className="font-bold text-sm">{stats.visitors}</span>
                            </div>
                            <div className="flex-1 aspect-[1.25] rounded-xl bg-[#1c1c1e] border border-white/5 shadow-sm flex flex-col items-center justify-center p-2 text-center">
                                <History className="h-5 w-5 text-muted-foreground mb-1" />
                                <span className="text-xs text-muted-foreground break-words w-full px-1">{project?.cloudflareDeployedAt ? new Date(project.cloudflareDeployedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "Never"}</span>
                            </div>
                            <div className="flex-1 aspect-[1.25] rounded-xl bg-[#1c1c1e] border border-white/5 shadow-sm flex flex-col items-center justify-center p-2 text-center">
                                <Activity className="h-5 w-5 text-muted-foreground mb-1" />
                                <span className="text-[10px] text-green-400 font-medium bg-green-500/10 px-1.5 py-0.5 rounded">Active</span>
                            </div>
                        </div>

                        <div className="h-4"></div> {/* Bottom spacing */}
                    </div>`;

if (content.includes(searchBlock)) {
    content = content.replace(searchBlock, replaceBlock);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log('File updated successfully.');
} else {
    console.log('Could not find the block to replace.');
}

import fs from 'fs';

let code = fs.readFileSync('src/routes/_app/alumnos.index.tsx', 'utf8');

const regex = /(<div className="flex items-center gap-3">[\s\S]*?<\/div>)\s*<div className="flex gap-1">\s*(<Link[\s\S]*?<\/Link>)\s*(\{canModifyData\(\) && \([\s\S]*?<\/Button>\s*\)\})\s*<\/div>\s*<\/div>/;

const newCode = `$1
                <div className="flex-1 overflow-x-auto mx-4 pb-2 sm:pb-0 hide-scrollbar">
                  <div className="flex gap-1.5 min-w-max">
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthNum = i + 1;
                      const isPaid = isMonthPaid(s.id, monthNum);
                      const isInactive = ((s as any).classrooms?.inactive_months || []).includes(monthNum);
                      return (
                        <button key={i} disabled={!canModifyData() || isInactive}
                          onClick={() => togglePayment.mutate({ studentId: s.id, month: monthNum, current: isPaid, fee: Number(s.monthly_fee ?? 0) })}
                          className={\`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex flex-col items-center justify-center transition-all flex-shrink-0 \${
                            isInactive 
                              ? "bg-amber-100/50 text-amber-700/50 border border-amber-300/50 cursor-not-allowed"
                              : isPaid 
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-300" 
                                : "bg-red-50 text-red-400 border border-red-200 hover:bg-red-100"
                          } \${!canModifyData() ? "cursor-default" : ""}\`}>
                          <span className="text-[9px] sm:text-[10px] font-medium leading-none mb-1">{months[i].substring(0, 3)}</span>
                          <span className="text-[10px] sm:text-xs leading-none">{isInactive ? "—" : isPaid ? "✓" : "·"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-1">
                  $2
                  $3
                </div>
              </div>`;

code = code.replace(regex, newCode);

fs.writeFileSync('src/routes/_app/alumnos.index.tsx', code);
console.log('Restored payment grid in alumnos.index.tsx');

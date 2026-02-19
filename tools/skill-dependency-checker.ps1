#Requires -Version 5.1
param(
    [switch]$Verbose,
    [switch]$FixSuggestions
)

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$SkillsDir = Join-Path $RootDir ".trae\skills"

$LayerDefinition = @{
    "terminology-standard" = 0
    "security-guard" = 0
    "output-normalizer" = 0
    "phase-stage-guard" = 0
    "fullstack-game-engine" = 1
    "skill-development-guide" = 1
    "state-manager" = 2
    "event-bus" = 2
    "command-manager" = 2
    "contract-validator" = 2
    "project-flow-manager" = 2
    "fullstack-engine-init" = 3
    "hr-manager" = 3
    "agent-dispatcher" = 3
    "qa-standards-manager" = 3
    "project-optimizer" = 3
    "requirement-normalizer" = 3
    "project-experience-summarizer" = 4
    "skill-optimizer" = 4
    "git-version-control" = 4
    "bug-tracker" = 4
    "asset-generation-manager" = 4
    "engine-module-debugger" = 4
    "pl-authority-guard" = 4
    "flow-strategy" = 4
}

function Write-ColorOutput {
    param([string]$Message, [string]$Type = "Info")
    $colors = @{ Success = "Green"; Error = "Red"; Warning = "Yellow"; Info = "Cyan"; Header = "Magenta" }
    Write-Host $Message -ForegroundColor $colors[$Type]
}

function Get-SkillMetadata {
    param([string]$FilePath)
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    $metadata = @{}
    
    $frontmatterMatch = [regex]::Match($content, '(?s)^---\s*?\r?\n(.*?)\r?\n---')
    if ($frontmatterMatch.Success) {
        $frontmatter = $frontmatterMatch.Groups[1].Value
        if ($frontmatter -match 'name:\s*["'']?([^"''\r\n]+)["'']?') { $metadata["name"] = $Matches[1].Trim() }
        if ($frontmatter -match 'layer:\s*(\d+)') { $metadata["layer"] = [int]$Matches[1] }
        
        $deps = @()
        $inDeps = $false
        $lines = $frontmatter -split "`r?`n"
        foreach ($line in $lines) {
            $trimmedLine = $line.Trim()
            if ($trimmedLine -match '^dependencies:\s*$') {
                $inDeps = $true
                continue
            }
            if ($inDeps) {
                if ($line -match '^\s*-\s*([a-zA-Z0-9-]+)\s*$') {
                    $deps += $Matches[1].Trim()
                } elseif ($line -match '^\s*-\s*name:\s*["'']?([^"''\r\n]+)["'']?') {
                    $deps += $Matches[1].Trim()
                } elseif ($line -match '^\s*name:\s*["'']?([^"''\r\n]+)["'']?' -and $line -notmatch '^\s*#\s*name:') {
                    $deps += $Matches[1].Trim()
                } elseif ($trimmedLine -match '^[a-zA-Z]') {
                    $inDeps = $false
                }
            }
        }
        $metadata["dependencies"] = $deps
    }
    return $metadata
}

function Get-ReferencedSkills {
    param([string]$FilePath)
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    $references = @()
    $pattern = '\[([a-zA-Z0-9-]+)\]\(\.trae/skills/([a-zA-Z0-9-]+)/SKILL\.md\)'
    $regexMatches = [regex]::Matches($content, $pattern)
    foreach ($match in $regexMatches) {
        $refName = $match.Groups[2].Value
        if ($refName -notin $references) { $references += $refName }
    }
    return $references
}

Write-ColorOutput "`n========================================" "Header"
Write-ColorOutput "  Skill Dependency Checker v2.0" "Header"
Write-ColorOutput "========================================`n" "Header"

$skillDirs = Get-ChildItem -Path $SkillsDir -Directory
$allSkills = @{}
$dependencyGraph = @{}
$errors = @()
$warnings = @()

Write-ColorOutput "[1/4] Scanning skill files..." "Info"

foreach ($dir in $skillDirs) {
    $skillFile = Join-Path $dir.FullName "SKILL.md"
    if (Test-Path $skillFile) {
        $metadata = Get-SkillMetadata -FilePath $skillFile
        $references = Get-ReferencedSkills -FilePath $skillFile
        $skillName = if ($metadata -and $metadata["name"]) { $metadata["name"] } else { $dir.Name }
        $declaredDeps = if ($metadata -and $metadata["dependencies"]) { $metadata["dependencies"] } else { @() }
        $layer = if ($metadata -and $metadata["layer"]) { $metadata["layer"] } else { $LayerDefinition[$skillName] }
        
        $allSkills[$skillName] = @{
            path = $skillFile
            dir = $dir.Name
            layer = $layer
            declaredDeps = $declaredDeps
            actualRefs = $references
        }
        $dependencyGraph[$skillName] = $declaredDeps
        
        if ($Verbose) { Write-Host "  Found: $skillName (Layer: $layer, Refs: $($references.Count))" -ForegroundColor Gray }
    }
}

Write-ColorOutput "  Scan complete: $($allSkills.Count) skills found`n" "Success"

Write-ColorOutput "[2/4] Checking circular dependencies..." "Info"

function Find-CircularDependencies {
    param([hashtable]$Graph)
    
    $visited = @{}
    $recStack = @{}
    $cycles = @()
    
    function DFS {
        param([string]$Node, [array]$Path)
        
        $visited[$Node] = $true
        $recStack[$Node] = $true
        $currentPath = $Path + $Node
        
        if ($Graph.ContainsKey($Node)) {
            foreach ($neighbor in $Graph[$Node]) {
                if ($Graph.ContainsKey($neighbor)) {
                    if (-not $visited[$neighbor]) {
                        $result = DFS -Node $neighbor -Path $currentPath
                        if ($result) { return $result }
                    } elseif ($recStack[$neighbor]) {
                        $cycleStart = $currentPath.IndexOf($neighbor)
                        $cycle = $currentPath[$cycleStart..($currentPath.Count-1)] + $neighbor
                        return $cycle
                    }
                }
            }
        }
        
        $recStack[$Node] = $false
        return $null
    }
    
    foreach ($node in $Graph.Keys) {
        if (-not $visited[$node]) {
            $cycle = DFS -Node $node -Path @()
            if ($cycle) {
                $cycles += ,@($cycle)
            }
        }
    }
    
    return $cycles
}

$cycles = Find-CircularDependencies -Graph $dependencyGraph

if ($cycles.Count -eq 0) { 
    Write-ColorOutput "  No circular dependencies found" "Success" 
} else { 
    Write-ColorOutput "  Found $($cycles.Count) circular dependencies!" "Error"
    foreach ($cycle in $cycles) {
        $errors += "Circular dependency: $($cycle -join ' -> ')"
    }
}

Write-ColorOutput "`n[3/4] Checking layer violations..." "Info"
$layerErrors = @()

foreach ($skillName in $allSkills.Keys) {
    $skill = $allSkills[$skillName]
    $skillLayer = $skill.layer
    if ($null -eq $skillLayer) {
        $warnings += "Skill '$skillName' has no layer defined"
        continue
    }
    
    foreach ($ref in $skill.declaredDeps) {
        if ($allSkills.ContainsKey($ref)) {
            $refLayer = $allSkills[$ref].layer
            if ($null -ne $refLayer -and $refLayer -gt $skillLayer) {
                $layerErrors += "Layer violation: '$skillName' (Layer $skillLayer) -> '$ref' (Layer $refLayer) [declared dependency]"
            }
        }
    }
}

if ($layerErrors.Count -eq 0) { Write-ColorOutput "  No layer violations found" "Success" }
else {
    Write-ColorOutput "  Found $($layerErrors.Count) layer violations!" "Error"
    $errors += $layerErrors
}

Write-ColorOutput "`n[4/4] Checking dependency declarations..." "Info"

foreach ($skillName in $allSkills.Keys) {
    $skill = $allSkills[$skillName]
    
    foreach ($dep in $skill.declaredDeps) {
        if ($dep -notin $allSkills.Keys) {
            $warnings += "Skill '$skillName' declares non-existent dependency '$dep'"
        }
    }
}

if ($warnings.Count -eq 0) { Write-ColorOutput "  All dependency declarations complete" "Success" }
else { Write-ColorOutput "  Found $($warnings.Count) warnings" "Warning" }

Write-ColorOutput "`n========================================" "Header"
Write-ColorOutput "  Summary" "Header"
Write-ColorOutput "========================================`n" "Header"

Write-ColorOutput "Total skills: $($allSkills.Count)" "Info"
Write-ColorOutput "Errors: $($errors.Count)" $(if ($errors.Count -gt 0) { "Error" } else { "Success" })
Write-ColorOutput "Warnings: $($warnings.Count)" $(if ($warnings.Count -gt 0) { "Warning" } else { "Success" })

if ($errors.Count -gt 0) {
    Write-ColorOutput "`nErrors:" "Error"
    foreach ($err in $errors) { Write-ColorOutput "  [ERROR] $err" "Error" }
}

if ($warnings.Count -gt 0) {
    Write-ColorOutput "`nWarnings:" "Warning"
    foreach ($warn in $warnings) { Write-ColorOutput "  [WARN] $warn" "Warning" }
}

if ($FixSuggestions) {
    Write-ColorOutput "`n========================================" "Header"
    Write-ColorOutput "  Fix Suggestions" "Header"
    Write-ColorOutput "========================================`n" "Header"
    
    foreach ($skillName in $allSkills.Keys) {
        $skill = $allSkills[$skillName]
        if ($skill.declaredDeps.Count -eq 0 -and $skill.actualRefs.Count -gt 0) {
            Write-ColorOutput "Add dependencies for '$skillName':" "Warning"
            Write-Host "  dependencies:" -ForegroundColor Gray
            foreach ($ref in $skill.actualRefs) { Write-Host "    - $ref" -ForegroundColor Gray }
            Write-Host ""
        }
        if ($null -eq $skill.layer) {
            Write-ColorOutput "Add layer for '$skillName'" "Warning"
        }
    }
}

Write-ColorOutput "`nDependency Graph:" "Header"
foreach ($skillName in $allSkills.Keys) {
    $skill = $allSkills[$skillName]
    $layer = if ($skill.layer) { $skill.layer } else { "?" }
    $deps = $skill.declaredDeps
    if ($deps.Count -gt 0) {
        Write-Host "[$layer] $skillName -> ($($deps -join ', '))" -ForegroundColor Cyan
    } else {
        Write-Host "[$layer] $skillName (no deps)" -ForegroundColor Gray
    }
}

Write-ColorOutput "`nCheck complete!`n" "Success"

if ($errors.Count -gt 0) { exit 1 }
exit 0

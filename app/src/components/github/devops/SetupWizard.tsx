import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useWorkflowTemplatesStore,
  WORKFLOW_TEMPLATES,
  getRecommendedTemplates,
  type WorkflowTemplate,
} from '@/presentation/stores';
import { useRepoStore } from '@/stores/repo';
import {
  Wand2,
  Search,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Code,
  FileCode,
  Rocket,
  Shield,
  Package,
  BookOpen,
  AlertCircle,
  Copy,
  Check,
  Download,
  RefreshCw,
} from 'lucide-react';

type WizardStep = 'analyze' | 'select' | 'customize' | 'preview' | 'create';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ci: <Code size={14} />,
  cd: <Rocket size={14} />,
  security: <Shield size={14} />,
  release: <Package size={14} />,
  docs: <BookOpen size={14} />,
};

const CATEGORY_LABELS: Record<string, string> = {
  ci: 'Continuous Integration',
  cd: 'Deployment',
  security: 'Security',
  release: 'Releases',
  docs: 'Documentation',
};

export function SetupWizard() {
  const repo = useRepoStore((state) => state.repo);
  const {
    detectedProjects,
    isAnalyzing,
    analysisComplete,
    selectedTemplate,
    customizations,
    generatedYaml,
    workflowPath,
    existingWorkflows,
    isCreating,
    createError,
    analyzeRepository,
    setSelectedTemplate,
    setCustomization,
    generateWorkflow,
    setWorkflowPath,
    createWorkflowFile,
    checkExistingWorkflows,
    reset,
  } = useWorkflowTemplatesStore();

  const [currentStep, setCurrentStep] = useState<WizardStep>('analyze');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-analyze on mount
  useEffect(() => {
    if (repo?.path && !analysisComplete) {
      analyzeRepository(repo.path);
      checkExistingWorkflows(repo.path);
    }
  }, [repo?.path, analysisComplete, analyzeRepository, checkExistingWorkflows]);

  // Generate workflow when template or customizations change
  useEffect(() => {
    if (selectedTemplate) {
      generateWorkflow();
    }
  }, [selectedTemplate, customizations, generateWorkflow]);

  const recommendedTemplates = getRecommendedTemplates(detectedProjects);

  const filteredTemplates = WORKFLOW_TEMPLATES.filter((template) => {
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.languages.some((l) =>
        l.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      !selectedCategory || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep('customize');
  };

  const handleCopyYaml = async () => {
    await navigator.clipboard.writeText(generatedYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateWorkflow = async () => {
    if (!repo?.path) return;
    try {
      await createWorkflowFile(repo.path);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        reset();
        setCurrentStep('analyze');
      }, 3000);
    } catch {
      // Error is handled in store
    }
  };

  const steps: { id: WizardStep; label: string }[] = [
    { id: 'analyze', label: 'Analyze' },
    { id: 'select', label: 'Select Template' },
    { id: 'customize', label: 'Customize' },
    { id: 'preview', label: 'Preview' },
    { id: 'create', label: 'Create' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <button
            onClick={() => {
              if (index <= currentStepIndex) {
                setCurrentStep(step.id);
              }
            }}
            disabled={index > currentStepIndex}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${
                currentStep === step.id
                  ? 'bg-accent-primary/20 text-accent-primary'
                  : index < currentStepIndex
                  ? 'bg-status-added/10 text-status-added cursor-pointer hover:bg-status-added/20'
                  : 'bg-surface text-text-muted cursor-not-allowed'
              }
            `}
          >
            {index < currentStepIndex ? (
              <CheckCircle size={12} />
            ) : (
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
                {index + 1}
              </span>
            )}
            <span className="hidden sm:inline">{step.label}</span>
          </button>
          {index < steps.length - 1 && (
            <ChevronRight size={14} className="mx-1 text-text-ghost" />
          )}
        </div>
      ))}
    </div>
  );

  const renderAnalyzeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-primary/20 flex items-center justify-center">
          <Wand2 className="w-8 h-8 text-accent-primary" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Set Up GitHub Actions
        </h2>
        <p className="text-sm text-text-muted max-w-md mx-auto">
          Let's analyze your project and recommend the best CI/CD workflows for
          your codebase.
        </p>
      </div>

      {isAnalyzing ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <RefreshCw className="w-8 h-8 text-accent-primary animate-spin" />
          <span className="text-sm text-text-muted">
            Analyzing your repository...
          </span>
        </div>
      ) : analysisComplete && detectedProjects.length > 0 ? (
        <div className="space-y-4">
          <div className="text-center text-sm text-text-muted mb-4">
            We detected the following technologies in your project:
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {detectedProjects.map((project, index) => (
              <motion.div
                key={project.language}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-4 flex items-center gap-3"
              >
                <span className="text-2xl">{project.icon}</span>
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    {project.language}
                  </div>
                  {project.framework && (
                    <div className="text-xs text-text-muted">
                      {project.framework}
                    </div>
                  )}
                  {project.packageManager && (
                    <div className="text-xs text-accent-primary">
                      {project.packageManager}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {existingWorkflows.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-status-modified/10 border border-status-modified/20">
              <div className="flex items-center gap-2 text-sm text-status-modified">
                <AlertCircle size={14} />
                <span>
                  Found {existingWorkflows.length} existing workflow
                  {existingWorkflows.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="mt-2 text-xs text-text-muted">
                {existingWorkflows.map((w) => (
                  <div key={w} className="flex items-center gap-1">
                    <FileCode size={10} />
                    {w}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setCurrentStep('select')}
            className="w-full py-3 px-4 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles size={16} />
            Choose a Workflow Template
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-text-muted mb-4">
            {analysisComplete
              ? "We couldn't detect your project type. You can still browse all templates."
              : 'Click below to analyze your repository.'}
          </p>
          <button
            onClick={() =>
              repo?.path
                ? analyzeRepository(repo.path)
                : setCurrentStep('select')
            }
            className="py-3 px-6 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            {repo?.path ? (
              <>
                <Search size={16} />
                Analyze Repository
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Browse Templates
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  const renderSelectStep = () => (
    <div className="space-y-4">
      {/* Recommended Section */}
      {recommendedTemplates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Sparkles size={14} className="text-accent-primary" />
            Recommended for Your Project
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {recommendedTemplates.slice(0, 4).map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="glass-card p-3 text-left hover:border-accent-primary/50 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{template.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary group-hover:text-accent-primary">
                        {template.name}
                      </span>
                      {template.popular && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-accent-primary/20 text-accent-primary">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted line-clamp-2 mt-1">
                      {template.description}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-text-ghost group-hover:text-accent-primary transition-colors"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface border border-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50"
          />
        </div>
        <div className="flex gap-1">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() =>
                setSelectedCategory(selectedCategory === key ? null : key)
              }
              title={label}
              className={`
                p-2 rounded-lg transition-colors
                ${
                  selectedCategory === key
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'bg-surface text-text-muted hover:text-text-primary'
                }
              `}
            >
              {CATEGORY_ICONS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* All Templates */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {selectedCategory
            ? CATEGORY_LABELS[selectedCategory]
            : 'All Templates'}
        </h3>
        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className="glass-card p-3 text-left hover:border-accent-primary/50 transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{template.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary group-hover:text-accent-primary">
                      {template.name}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-surface text-text-muted">
                      {CATEGORY_LABELS[template.category]}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted line-clamp-1 mt-1">
                    {template.description}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {template.languages.slice(0, 3).map((lang) => (
                      <span
                        key={lang}
                        className="text-[10px] px-1 py-0.5 rounded bg-white/5 text-text-muted"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className="text-text-ghost group-hover:text-accent-primary transition-colors"
                />
              </div>
            </button>
          ))}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-text-muted text-sm">
              No templates match your search.
            </div>
          )}
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={() => setCurrentStep('analyze')}
        className="w-full py-2 text-sm text-text-muted hover:text-text-primary flex items-center justify-center gap-2"
      >
        <ChevronLeft size={14} />
        Back to Analysis
      </button>
    </div>
  );

  const renderCustomizeStep = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="space-y-6">
        {/* Template Info */}
        <div className="glass-card p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{selectedTemplate.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {selectedTemplate.name}
              </h3>
              <p className="text-sm text-text-muted mt-1">
                {selectedTemplate.description}
              </p>
            </div>
          </div>
        </div>

        {/* Customization Options */}
        {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-text-primary">
              Configuration
            </h4>
            {selectedTemplate.variables.map((variable) => (
              <div key={variable.name} className="space-y-1">
                <label className="text-xs text-text-muted">
                  {variable.description}
                </label>
                {variable.options ? (
                  <div className="flex gap-2">
                    {variable.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setCustomization(variable.name, option)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                          ${
                            customizations[variable.name] === option
                              ? 'bg-accent-primary/20 text-accent-primary'
                              : 'bg-surface text-text-muted hover:text-text-primary'
                          }
                        `}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={customizations[variable.name] || variable.default}
                    onChange={(e) =>
                      setCustomization(variable.name, e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-white/5 text-sm text-text-primary focus:outline-none focus:border-accent-primary/50"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Workflow Path */}
        <div className="space-y-1">
          <label className="text-xs text-text-muted">Workflow File Path</label>
          <input
            type="text"
            value={workflowPath}
            onChange={(e) => setWorkflowPath(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-white/5 text-sm text-text-primary font-mono focus:outline-none focus:border-accent-primary/50"
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setCurrentStep('select');
            }}
            className="flex-1 py-2.5 rounded-xl bg-surface hover:bg-hover text-text-primary text-sm font-medium flex items-center justify-center gap-2"
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <button
            onClick={() => setCurrentStep('preview')}
            className="flex-1 py-2.5 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white text-sm font-medium flex items-center justify-center gap-2"
          >
            Preview Workflow
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderPreviewStep = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Generated Workflow
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopyYaml}
            className="p-2 rounded-lg bg-surface hover:bg-hover text-text-muted hover:text-text-primary transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* YAML Preview */}
      <div className="relative">
        <pre className="p-4 rounded-xl bg-void border border-white/5 overflow-auto max-h-[350px] text-xs font-mono text-text-secondary">
          <code>{generatedYaml}</code>
        </pre>
      </div>

      {/* File Path */}
      <div className="p-3 rounded-lg bg-surface flex items-center gap-2">
        <FileCode size={14} className="text-text-muted" />
        <span className="text-xs text-text-muted">Will be created at:</span>
        <span className="text-xs font-mono text-accent-primary">
          {workflowPath}
        </span>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setCurrentStep('customize')}
          className="flex-1 py-2.5 rounded-xl bg-surface hover:bg-hover text-text-primary text-sm font-medium flex items-center justify-center gap-2"
        >
          <ChevronLeft size={16} />
          Customize
        </button>
        <button
          onClick={() => setCurrentStep('create')}
          className="flex-1 py-2.5 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white text-sm font-medium flex items-center justify-center gap-2"
        >
          Create Workflow
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderCreateStep = () => (
    <div className="space-y-6">
      {showSuccess ? (
        <motion.div
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-status-added/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-status-added" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Workflow Created!
          </h3>
          <p className="text-sm text-text-muted max-w-sm mx-auto">
            Your workflow file has been created at{' '}
            <code className="text-accent-primary">{workflowPath}</code>
          </p>
          <div className="mt-6 text-xs text-text-muted">
            Commit and push to activate the workflow on GitHub.
          </div>
        </motion.div>
      ) : (
        <>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-primary/20 flex items-center justify-center">
              <Rocket className="w-8 h-8 text-accent-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Ready to Create
            </h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              This will create the workflow file in your repository. You'll need
              to commit and push to activate it on GitHub.
            </p>
          </div>

          {/* Summary */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">{selectedTemplate?.icon}</span>
              <div>
                <div className="text-sm font-medium text-text-primary">
                  {selectedTemplate?.name}
                </div>
                <div className="text-xs text-text-muted">
                  {selectedTemplate?.category &&
                    CATEGORY_LABELS[selectedTemplate.category]}
                </div>
              </div>
            </div>
            <div className="border-t border-white/5 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">File:</span>
                <span className="font-mono text-text-primary">
                  {workflowPath}
                </span>
              </div>
              {Object.entries(customizations).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{key}:</span>
                  <span className="text-text-primary">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {createError && (
            <div className="p-3 rounded-lg bg-status-deleted/10 border border-status-deleted/20 flex items-center gap-2 text-sm text-status-deleted">
              <AlertCircle size={14} />
              {createError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep('preview')}
              className="flex-1 py-2.5 rounded-xl bg-surface hover:bg-hover text-text-primary text-sm font-medium flex items-center justify-center gap-2"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              onClick={handleCreateWorkflow}
              disabled={isCreating}
              className="flex-1 py-2.5 rounded-xl bg-status-added hover:bg-status-added/90 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Create Workflow File
                </>
              )}
            </button>
          </div>

          {/* Alternative: Manual Copy */}
          <div className="text-center">
            <p className="text-xs text-text-ghost mb-2">
              Or manually copy the workflow
            </p>
            <button
              onClick={handleCopyYaml}
              className="text-xs text-accent-primary hover:text-accent-primary/80 flex items-center gap-1 mx-auto"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy YAML to clipboard'}
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'analyze':
        return renderAnalyzeStep();
      case 'select':
        return renderSelectStep();
      case 'customize':
        return renderCustomizeStep();
      case 'preview':
        return renderPreviewStep();
      case 'create':
        return renderCreateStep();
      default:
        return renderAnalyzeStep();
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {renderStepIndicator()}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderCurrentStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

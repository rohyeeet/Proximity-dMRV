-- CreateTable
CREATE TABLE "DomainPack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "chainOfCustodyModes" TEXT[],
    "defaultChainOfCustodyMode" TEXT,

    CONSTRAINT "DomainPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domainPackId" TEXT NOT NULL,
    "planTier" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarInitials" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "canView" TEXT[],
    "canAct" TEXT[],
    "cannot" TEXT[],

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "OrgMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "domainPackId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "connectorIds" TEXT[],
    "formTemplateIds" TEXT[],

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "domainPackId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTemplateVersion" (
    "id" TEXT NOT NULL,
    "formTemplateId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "fields" JSONB NOT NULL,

    CONSTRAINT "FormTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowTemplate" (
    "id" TEXT NOT NULL,
    "domainPackId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "triggerLabel" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,

    CONSTRAINT "FlowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "formTemplateId" TEXT NOT NULL,
    "formTemplateVersionNo" INTEGER NOT NULL,
    "flowNodeLabel" TEXT NOT NULL,
    "reviewStatus" TEXT NOT NULL,
    "syncStatus" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "currentVersionNo" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "answers" JSONB NOT NULL,
    "evidence" JSONB NOT NULL,
    "versions" JSONB NOT NULL,
    "reviewActions" JSONB NOT NULL,
    "linkedSubmissionIds" TEXT[],
    "smartCheckSummary" TEXT NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connector" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "connectorType" TEXT NOT NULL,
    "protocol" TEXT,
    "status" TEXT NOT NULL,
    "endpoint" TEXT,

    CONSTRAINT "Connector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "externalRef" TEXT NOT NULL,
    "calibration" JSONB,
    "coveragePct" INTEGER NOT NULL,
    "lastGapMinutes" INTEGER,
    "tags" JSONB NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemetryStream" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "parameterCode" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "latestValue" DOUBLE PRECISION NOT NULL,
    "thresholdHigh" DOUBLE PRECISION,
    "points" JSONB NOT NULL,

    CONSTRAINT "TelemetryStream_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DomainPack_slug_key" ON "DomainPack"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_domainPackId_idx" ON "Organization"("domainPackId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Role_organizationId_idx" ON "Role"("organizationId");

-- CreateIndex
CREATE INDEX "OrgMembership_userId_idx" ON "OrgMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgMembership_organizationId_userId_key" ON "OrgMembership"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Stage_domainPackId_idx" ON "Stage"("domainPackId");

-- CreateIndex
CREATE INDEX "FormTemplate_domainPackId_idx" ON "FormTemplate"("domainPackId");

-- CreateIndex
CREATE UNIQUE INDEX "FormTemplate_domainPackId_code_key" ON "FormTemplate"("domainPackId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FormTemplateVersion_formTemplateId_versionNo_key" ON "FormTemplateVersion"("formTemplateId", "versionNo");

-- CreateIndex
CREATE INDEX "FlowTemplate_domainPackId_idx" ON "FlowTemplate"("domainPackId");

-- CreateIndex
CREATE UNIQUE INDEX "FlowTemplate_domainPackId_code_key" ON "FlowTemplate"("domainPackId", "code");

-- CreateIndex
CREATE INDEX "Submission_formTemplateId_idx" ON "Submission"("formTemplateId");

-- CreateIndex
CREATE INDEX "Submission_submittedByUserId_idx" ON "Submission"("submittedByUserId");

-- CreateIndex
CREATE INDEX "Submission_reviewStatus_idx" ON "Submission"("reviewStatus");

-- CreateIndex
CREATE INDEX "Connector_organizationId_idx" ON "Connector"("organizationId");

-- CreateIndex
CREATE INDEX "Device_connectorId_idx" ON "Device"("connectorId");

-- CreateIndex
CREATE UNIQUE INDEX "TelemetryStream_deviceId_parameterCode_key" ON "TelemetryStream"("deviceId", "parameterCode");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_domainPackId_fkey" FOREIGN KEY ("domainPackId") REFERENCES "DomainPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMembership" ADD CONSTRAINT "OrgMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMembership" ADD CONSTRAINT "OrgMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMembership" ADD CONSTRAINT "OrgMembership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_domainPackId_fkey" FOREIGN KEY ("domainPackId") REFERENCES "DomainPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTemplate" ADD CONSTRAINT "FormTemplate_domainPackId_fkey" FOREIGN KEY ("domainPackId") REFERENCES "DomainPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTemplateVersion" ADD CONSTRAINT "FormTemplateVersion_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "FormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowTemplate" ADD CONSTRAINT "FlowTemplate_domainPackId_fkey" FOREIGN KEY ("domainPackId") REFERENCES "DomainPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "FormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connector" ADD CONSTRAINT "Connector_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelemetryStream" ADD CONSTRAINT "TelemetryStream_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

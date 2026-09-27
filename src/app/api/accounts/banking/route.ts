import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AccountsService } from "@/services/accounts.service";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const orgId = AccountsService.getOrgId(user);

    const accounts = await db.bankAccount.findMany({
      where: { organizationId: orgId },
      include: {
        transactions: {
          orderBy: { date: "desc" },
          take: 25,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(accounts);
  } catch (error: any) {
    console.error("[Accounts Banking GET Error]:", error);
    return errorResponse(error.message || "Failed to fetch bank accounts", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const orgId = AccountsService.getOrgId(user);

    const body = await req.json();
    const { action } = body;

    // Action 1: Create new Bank Account
    if (action === "CREATE_ACCOUNT") {
      const { accountName, bankName, accountNumber, accountType, ifscOrSwift, branchName, openingBalance } = body;
      if (!accountName || !bankName || !accountNumber) {
        return errorResponse("Account Name, Bank Name, and Account Number are required", "BAD_REQUEST", 400);
      }

      // Create linked Account in Chart of Accounts
      const code = `10${Math.floor(50 + Math.random() * 40)}`;
      const glAccount = await db.account.create({
        data: {
          organizationId: orgId,
          code,
          name: `${bankName} - ${accountName}`,
          type: "ASSET",
          subcategory: accountType === "CASH" ? "CURRENT_ASSET" : "BANK",
          balance: Number(openingBalance) || 0.0,
          currency: "INR",
        },
      });

      const bank = await db.bankAccount.create({
        data: {
          organizationId: orgId,
          accountId: glAccount.id,
          accountName,
          bankName,
          accountNumber,
          accountType: accountType || "CURRENT",
          ifscOrSwift,
          branchName,
          currentBalance: Number(openingBalance) || 0.0,
          availableBalance: Number(openingBalance) || 0.0,
          currency: "INR",
        },
      });

      return successResponse(bank, 201);
    }

    // Action 2: Bank Transfer between accounts
    if (action === "TRANSFER") {
      const { fromAccountId, toAccountId, amount, date, reference, notes } = body;
      if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
        return errorResponse("Source, Destination, and positive Amount are required", "BAD_REQUEST", 400);
      }
      if (fromAccountId === toAccountId) {
        return errorResponse("Source and destination accounts must be different", "BAD_REQUEST", 400);
      }

      const fromBank = await db.bankAccount.findUnique({ where: { id: fromAccountId } });
      const toBank = await db.bankAccount.findUnique({ where: { id: toAccountId } });

      if (!fromBank || !toBank) return errorResponse("Bank account not found", "NOT_FOUND", 404);

      // Update balances
      await db.bankAccount.update({
        where: { id: fromAccountId },
        data: {
          currentBalance: { decrement: amount },
          availableBalance: { decrement: amount },
        },
      });

      await db.bankAccount.update({
        where: { id: toAccountId },
        data: {
          currentBalance: { increment: amount },
          availableBalance: { increment: amount },
        },
      });

      // Create Bank Transactions on both sides
      await db.bankTransaction.create({
        data: {
          bankAccountId: fromAccountId,
          date: date ? new Date(date) : new Date(),
          type: "TRANSFER",
          amount,
          payeeOrPayer: `Transfer to ${toBank.accountName}`,
          reference: reference || `TRF-${Date.now().toString().slice(-6)}`,
          description: notes || "Internal fund transfer",
          status: "RECONCILED",
          reconciledAt: new Date(),
        },
      });

      await db.bankTransaction.create({
        data: {
          bankAccountId: toAccountId,
          date: date ? new Date(date) : new Date(),
          type: "DEPOSIT",
          amount,
          payeeOrPayer: `Transfer from ${fromBank.accountName}`,
          reference: reference || `TRF-${Date.now().toString().slice(-6)}`,
          description: notes || "Internal fund transfer",
          status: "RECONCILED",
          reconciledAt: new Date(),
        },
      });

      // Post Double-Entry Journal: Dr. Destination Bank / Cr. Source Bank
      if (fromBank.accountId && toBank.accountId) {
        await db.journalEntry.create({
          data: {
            organizationId: orgId,
            entryNumber: `JRN-${Date.now().toString().slice(-6)}`,
            reference: reference || "Bank Transfer",
            sourceType: "BANK_TRANSFER",
            totalAmount: amount,
            status: "POSTED",
            lines: {
              create: [
                {
                  accountId: toBank.accountId,
                  type: "DEBIT",
                  amount,
                  description: `Transfer in from ${fromBank.bankName}`,
                },
                {
                  accountId: fromBank.accountId,
                  type: "CREDIT",
                  amount,
                  description: `Transfer out to ${toBank.bankName}`,
                },
              ],
            },
          },
        });
      }

      return successResponse({ success: true, message: "Transfer completed successfully" });
    }

    // Action 3: Reconcile transaction
    if (action === "RECONCILE") {
      const { transactionId, status } = body;
      if (!transactionId) return errorResponse("Transaction ID is required", "BAD_REQUEST", 400);

      const txn = await db.bankTransaction.update({
        where: { id: transactionId },
        data: {
          status: status || "RECONCILED",
          reconciledAt: status === "UNRECONCILED" ? null : new Date(),
        },
      });

      return successResponse(txn);
    }

    return errorResponse("Unknown action", "BAD_REQUEST", 400);
  } catch (error: any) {
    console.error("[Accounts Banking POST Error]:", error);
    return errorResponse(error.message || "Failed to process banking request", "INTERNAL_ERROR", 500);
  }
}

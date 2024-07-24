import {
  Transfer
} from "../generated/kBTC/kBTC"

import {TokenBalance, TokenBalanceHistory} from "../generated/schema"

import {
  fetchTokenDetails,
  fetchAccount,
  fetchBalance
} from "./utils"

//import datatype
import { BigDecimal} from "@graphprotocol/graph-ts";


export function handleTransfer(event: Transfer): void {
  let token = fetchTokenDetails(event);
  if (!token) { //if token == null
      return
    }

  //get account addresses from event
  let fromAddress = event.params.from.toHex();
  let toAddress = event.params.to.toHex();

  //fetch account details
  let fromAccount = fetchAccount(fromAddress);
  let toAccount = fetchAccount(toAddress);

  if (!fromAccount || !toAccount) {
  return;
  }
  //setting the token balance of the 'from' account
  let fromTokenBalance = TokenBalance.load(token.id + "-" + fromAccount.id);
  if (!fromTokenBalance) { //if balance is not already saved
        //create a new TokenBalance instance
        // while creating the new token balance,
        // the combination of the token address 
        // and the account address is  
        // passed as the identifier value
        fromTokenBalance = new TokenBalance(token.id + "-" + fromAccount.id);
        fromTokenBalance.token = token.id;
        fromTokenBalance.account = fromAccount.id;
  }
  let balanceHistoryItem = new TokenBalanceHistory(
    event.transaction.hash.toHexString() + fromAccount.id
    );
  fromTokenBalance.amount = fetchBalance(event.address,event.params.from);
  if(fromTokenBalance.account != "0x0000000000000000000000000000000000000000"){
      balanceHistoryItem = new TokenBalanceHistory(
      event.transaction.hash.toHexString() + fromAccount.id
      );
      balanceHistoryItem.timestamp = event.block.timestamp.toI32();
      balanceHistoryItem.account = fromAccount.id;
      balanceHistoryItem.amount = fromTokenBalance.amount;
      balanceHistoryItem.save();
  }
  
  //filtering out zero-balance tokens - optional
  fromTokenBalance.save();
  
  //setting the token balance of the 'to' account
  let toTokenBalance = TokenBalance.load(token.id + "-" + toAccount.id);
  if (!toTokenBalance) {
      toTokenBalance = new TokenBalance(token.id + "-" + toAccount.id);
      toTokenBalance.token = token.id;
      toTokenBalance.account = toAccount.id;
    }
  toTokenBalance.amount = fetchBalance(event.address,event.params.to)
  if(toTokenBalance.account != "0x0000000000000000000000000000000000000000"){
    balanceHistoryItem = new TokenBalanceHistory(
      event.transaction.hash.toHexString() + toAccount.id
      );
    balanceHistoryItem.account = toAccount.id;
    balanceHistoryItem.amount = toTokenBalance.amount;
    balanceHistoryItem.timestamp = event.block.timestamp.toI32();
    balanceHistoryItem.save();
  }
  
  toTokenBalance.save();
}
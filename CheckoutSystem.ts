// Payement->(stripe, paypal, in-house store credit)->some support refund, some partial capture, some neither.
// Order can be split across multiple provider in one transaction eg. (30 store credit + 20 paypal).
// Retry for an idempotent charge and a retry for a non-idempotent one are not same thing and 
// a wrong retry can double-charge.
// Fraud check before charging set of checks changes per region. Compliance owns rules, payment team own charging.
// whole flow must be unit testable with zero network calls, finance team must be able to add a new provider

interface Payment{
    charge(amount: number):void;
}
interface PaymentInfo{
    Payment: Payment,
    amount: number
}
interface Refund{
    refundCharge(amount: number):void;
}
interface PartialCapture{
    partialCharge(amount: number):void;
}
interface FraudCheck{
    check(amount: number):boolean;
}
interface Retry{
    retry():void;
}
class Stripe implements Payment, Refund, PartialCapture{
    charge(amount: number): void {
        console.log(`Stripe Payment Charge ${amount}`);
    }
    refundCharge(amount: number): void {
        console.log(`Stripe Payment Refund ${amount}`);
    }
    partialCharge(amount: number): void {
        console.log(`Stripe Payment Partial Charge ${amount}`);
    }
}
class Paypal implements Payment, Refund{
    charge(amount: number): void {
        console.log(`Paypal Payment Charge ${amount}`);
    }
    refundCharge(amount: number): void {
        console.log(`Paypal Payment Refund ${amount}`);
    }
}
class Wallet implements Payment{
    charge(amount: number): void {
        console.log(`Wallet Payment Charge ${amount}`);
    }
}
class SecurityChecker implements FraudCheck{
    check(amount: number): boolean {
        console.log(`Checking security for amount: ${amount}`)
        return true;
    }
}
class Idempotent implements Retry{
    retry(): void {
        console.log("Retrying safely...")
    }
}
class NonIdempotent implements Retry{
    retry(): void {
        console.log("Do not close or retry")
    }
}

class CheckoutSystem{
    constructor(
        private fraudCheck:SecurityChecker,
        private retry:Retry,
    ){}
    checkout(payment:PaymentInfo[]):void{
        payment.forEach((p)=>{
            if(!this.fraudCheck.check(p.amount)){
                console.log("Fraud Detected");
                return;
            }
            p.Payment.charge(p.amount);
        });
    }
}
const stripe=new Stripe();
const wallet=new Wallet();
const paypal=new Paypal();
const fraud=new SecurityChecker();
const retry=new Idempotent();
const order=new CheckoutSystem(fraud, retry);
order.checkout([
    {Payment:stripe, amount:30},
    {Payment:wallet, amount:20},
    {Payment:paypal, amount:50},
]);

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
    payment: Payment,
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
    retry(payment: Payment, amount: number):void;
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
    retry(payment: Payment, amount: number): void {
        console.log(`Retrying safely for ${amount}...`)
    }
}
class NonIdempotent implements Retry{
    retry(payment: Payment, amount: number): void {
        console.log(`Do not close or retry..retrying automatically for ${amount}`)
    }
}

class CheckoutSystem{
    constructor(
        private fraudCheck:FraudCheck,
        private retry:Retry,
    ){}
    checkout(payment:PaymentInfo[]):void{
        for(const p of payment){
            if(!this.fraudCheck.check(p.amount)){
                console.log("Fraud Detected");
                return;
            }
            try{
                p.payment.charge(p.amount);
            }
            catch{
                this.retry.retry(p.payment,p.amount);
            }
        }
    }
}
const stripe=new Stripe();
const wallet=new Wallet();
const paypal=new Paypal();
const fraud=new SecurityChecker();
const retry=new Idempotent();
const order=new CheckoutSystem(fraud, retry);
order.checkout([
    {payment:stripe, amount:30},
    {payment:wallet, amount:20},
    {payment:paypal, amount:50},
]);
